import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connect } from "@/dbConfig/dbConfig";
import RequestModel from "@/models/Request";
import Gym from "@/models/Gym";
import User from "@/models/User";

connect();

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, gymId, password } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (gymId) {
      const gym = await Gym.findById(gymId);
      if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Avoid duplicate pending requests
    const existingReq = await RequestModel.findOne({ email, role, status: "pending" });
    if (existingReq) return NextResponse.json({ error: "Request already pending" }, { status: 409 });

    // Avoid duplicate user
    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const doc = await RequestModel.create({
      email,
      name,
      role,
      gym: gymId || undefined,
      hashedPassword,
      status: "pending", // 👈 explicitly set
    });

    return NextResponse.json({ message: "Request created", requestId: doc._id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
