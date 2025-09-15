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

    if (memberIds.length > 0) {
      const { data: profData, error: profError } = await supabaseAdmin
        .from("member_profiles")
        .select("user_id, height_cm, weight_kg, bmi, dob, plan")
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

// ✅ Merge users with profiles
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
          }
        : null,
    };
  }
  return { ...u, profile: null };
});



    return NextResponse.json({ users: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
