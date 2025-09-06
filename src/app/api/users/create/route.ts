import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import Gym from "@/models/Gym";
import bcrypt from "bcryptjs";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function POST(req: NextRequest) {
  try {
    const cur = getDataFromToken(req);
    if (!cur || !["admin", "superadmin"].includes(cur.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, username, name, role, gymId, profile } = await req.json();
    if (!email || !password || !role || !gymId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    if (cur.role === "admin" && String(cur.gym) !== String(gymId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const gym = await Gym.findById(gymId);
    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });

    const exists = await User.findOne({ email });
    if (exists) return NextResponse.json({ error: "Email exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);

    // username fallback: use provided username, else email prefix, else generated unique suffix
    let finalUsername = username;
    if (!finalUsername) {
      finalUsername = email.split("@")[0];
      // optionally append a random number if needed to avoid collision
      let tries = 0;
      while (await User.findOne({ username: finalUsername }) && tries < 5) {
        finalUsername = `${email.split("@")[0]}${Math.floor(Math.random() * 1000)}`;
        tries++;
      }
    }

    const newUser = await User.create({
      email,
      password: hashed,
      username: finalUsername,
      name: name || finalUsername,
      role,
      gym: gym._id,
      profile: profile || {},
      createdBy: cur.id,
      status: "approved"
    });

    const safe = newUser.toObject(); delete safe.password;
    return NextResponse.json({ message: "User created", user: safe });
  } catch (err: any) {
    console.error("Error in /users/create:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
