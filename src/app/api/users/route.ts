import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function GET(req: NextRequest) {
  try {
    const profile = await getDataFromToken(req);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only allow admins and superadmins to fetch users
    if (profile.role !== "admin" && profile.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ If superadmin → fetch all users
    let userQuery = supabaseAdmin
      .from("users")
      .select("id, email, name, role, created_at, gym_id");

    if (profile.role === "admin") {
      userQuery = userQuery.eq("gym_id", profile.gym_id);
    }

    const { data: users, error: userError } = await userQuery.in("role", [
      "member",
      "trainer",
      "nutritionist",
    ]);

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const memberIds = users.filter((u) => u.role === "member").map((u) => u.id);
    let profiles: Record<string, any> = {};

    // Fetch member profiles with assignment info
    if (memberIds.length > 0) {
      const { data: profData, error: profError } = await supabaseAdmin
        .from("member_profiles")
        .select(`
          user_id, 
          height_cm, 
          weight_kg, 
          bmi, 
          dob, 
          plan,
          gender,
          goal,
          activity_level,
          assigned_trainer_id,
          assigned_nutritionist_id
        `)
        .in("user_id", memberIds);

      if (profError) {
        return NextResponse.json({ error: profError.message }, { status: 500 });
      }

      // Map for faster lookup
      profiles = profData.reduce(
        (acc, p) => ({ ...acc, [p.user_id]: p }),
        {} as Record<string, any>
      );
    }

    // Fetch trainer profiles
    const trainerIds = users.filter((u) => u.role === "trainer").map((u) => u.id);
    let trainerProfiles: Record<string, any> = {};
    if (trainerIds.length > 0) {
      const { data: trainerData, error: trainerError } = await supabaseAdmin
        .from("trainers_profile")
        .select("user_id, name, specialization, experience_years")
        .in("user_id", trainerIds);

      if (trainerError) {
        console.error("Trainer profile error:", trainerError);
      } else {
        trainerProfiles = trainerData.reduce(
          (acc, t) => ({ ...acc, [t.user_id]: t }),
          {} as Record<string, any>
        );
      }
    }

    // Fetch nutritionist profiles
    const nutritionistIds = users.filter((u) => u.role === "nutritionist").map((u) => u.id);
    let nutritionistProfiles: Record<string, any> = {};
    if (nutritionistIds.length > 0) {
      const { data: nutritionistData, error: nutritionistError } = await supabaseAdmin
        .from("nutritionists_profile")
        .select("user_id, full_name, certification")
        .in("user_id", nutritionistIds);

      if (nutritionistError) {
        console.error("Nutritionist profile error:", nutritionistError);
      } else {
        nutritionistProfiles = nutritionistData.reduce(
          (acc, n) => ({ ...acc, [n.user_id]: n }),
          {} as Record<string, any>
        );
      }
    }

    function calculateAge(dob: string): number | null {
      if (!dob) return null;
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) {
        console.error("Invalid date of birth:", dob);
        return null;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 0 || age > 120) {
        console.error("Calculated age out of reasonable range:", age, "for dob:", dob);
        return null;
      }

      return age;
    }

    // ✅ Merge users with profiles and trainer/nutritionist info
    const formatted = users.map((u) => {
      if (u.role === "member") {
        const p = profiles[u.id];
        return {
          ...u,
          profile: p
            ? {
                height_cm: p.height_cm,
                weight_kg: p.weight_kg,
                bmi: p.bmi,
                age: p.dob ? calculateAge(p.dob) : null,
                plan: p.plan,
                gender: p.gender,
                goal: p.goal,
                activity_level: p.activity_level,
                assigned_trainer_id: p.assigned_trainer_id,
                assigned_nutritionist_id: p.assigned_nutritionist_id,
              }
            : {
                assigned_trainer_id: null,
                assigned_nutritionist_id: null,
              },
          // Add trainer and nutritionist info from their profiles
          trainer: p?.assigned_trainer_id ? trainerProfiles[p.assigned_trainer_id] : null,
          nutritionist: p?.assigned_nutritionist_id ? nutritionistProfiles[p.assigned_nutritionist_id] : null,
        };
      } else if (u.role === "trainer") {
        return {
          ...u,
          profile: trainerProfiles[u.id] || null,
        };
      } else if (u.role === "nutritionist") {
        return {
          ...u,
          profile: nutritionistProfiles[u.id] || null,
        };
      }
      return { ...u, profile: null };
    });

    // Separate arrays for frontend convenience
    const members = formatted.filter((u) => u.role === "member");
    const trainers = formatted.filter((u) => u.role === "trainer");
    const nutritionists = formatted.filter((u) => u.role === "nutritionist");

    return NextResponse.json({ 
      users: formatted,
      members,
      trainers,
      nutritionists 
    });
  } catch (err: any) {
    console.error("Users API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}