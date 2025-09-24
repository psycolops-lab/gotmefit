// src/app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (cur.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      role, 
      height_cm, 
      weight_kg, 
      bmi, 
      dob, 
      plan,
      // Trainer/Nutritionist specific fields
      specialization,
      experience_years,
      certification,
      // Assignment fields for members
      trainer_id,
      nutritionist_id
    } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["member", "trainer", "nutritionist"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Validate required fields for trainers/nutritionists
    if (role === "trainer" && !name) {
      return NextResponse.json({ error: "Name is required for trainers" }, { status: 400 });
    }
    if (role === "nutritionist" && !name) {
      return NextResponse.json({ error: "Name is required for nutritionists" }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name: name || null },
});

if (authError || !data?.user?.id) {
  console.error("Create auth user error:", authError);
  return NextResponse.json({ error: authError?.message || "Failed to create auth user" }, { status: 500 });
}

const newUserId = data.user.id;


    // Insert user in users table
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: newUserId,
        email,
        name: name || null,
        role,
        gym_id: cur.gym_id,
        created_at: new Date().toISOString(),
      });

    if (userError) {
      console.error("Insert user error:", userError);
      // Cleanup auth user on error
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    let profileError = null;

    // Insert profile based on role
    if (role === "member") {
      // Member profile with trainer/nutritionist assignments
      const { error: memberProfileError } = await supabaseAdmin
        .from("member_profiles")
        .insert({
          user_id: newUserId,
          height_cm: height_cm ? parseFloat(height_cm) : null,
          weight_kg: weight_kg ? parseFloat(weight_kg) : null,
          bmi: bmi ? parseFloat(bmi) : null,
          plan: plan || null,
          dob: dob || null,
          gender: body.gender || null,
          goal: body.goal || null,
          activity_level: body.activity_level || null,
          assigned_trainer_id: trainer_id || null,
          assigned_nutritionist_id: nutritionist_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (memberProfileError) {
        console.error("Insert member profile error:", memberProfileError);
        profileError = memberProfileError;
      }

    } else if (role === "trainer") {
      // Trainer profile
      const { error: trainerProfileError } = await supabaseAdmin
        .from("trainers_profile")
        .insert({
          user_id: newUserId,
          name: name, // Required field
          specialization: specialization || null,
          experience_years: experience_years ? parseInt(experience_years) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (trainerProfileError) {
        console.error("Insert trainer profile error:", trainerProfileError);
        profileError = trainerProfileError;
      }

    } else if (role === "nutritionist") {
      // Nutritionist profile
      const { error: nutritionistProfileError } = await supabaseAdmin
        .from("nutritionists_profile")
        .insert({
          user_id: newUserId,
          full_name: name, // Required field
          certification: certification || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (nutritionistProfileError) {
        console.error("Insert nutritionist profile error:", nutritionistProfileError);
        profileError = nutritionistProfileError;
      }
    }

    // Cleanup on profile creation error
    if (profileError) {
      console.error(`Insert ${role} profile error:`, profileError);
      // Delete user record
      await supabaseAdmin.from("users").delete().eq("id", newUserId);
      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ message: `${role} created successfully` });
  } catch (err: any) {
    console.error("POST /api/users/create error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}