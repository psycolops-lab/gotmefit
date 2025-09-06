import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connect } from "@/dbConfig/dbConfig";
import Gym from "@/models/Gym";
import User from "@/models/User";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function POST(req: NextRequest) {
  try {
    const current = getDataFromToken(req);
    if (!current || current.role !== "superadmin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { gymId, adminEmail, adminPassword, adminName } = await req.json();
    if (!gymId || !adminEmail || !adminPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const gym = await Gym.findById(gymId);
    if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });

    const exists = await User.findOne({ email: adminEmail });
    if (exists) return NextResponse.json({ error: "Email exists" }, { status: 409 });

    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({
      username: adminName || adminEmail.split("@")[0],
      email: adminEmail,
      password: hashed,
      role: "admin",
      gym: gym._id,
      createdBy: current.id,
      status: "approved"
    });

    return NextResponse.json({ message: "Admin added", admin });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
