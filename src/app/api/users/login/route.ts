import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

connect();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    const token = jwt.sign({ id: user._id, role: user.role, gym: user.gym }, process.env.TOKEN_SECRET || "dev-secret", { expiresIn: "7d" });

    const res = NextResponse.json({ message: "Logged in", user: { id: user._id, role: user.role, gym: user.gym }});
    res.cookies.set("token", token, { httpOnly: true, path: "/" });
    return res;
  } catch (err: any) {
    console.error("Error in /users/login:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
