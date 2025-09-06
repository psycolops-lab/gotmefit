import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Gym from "@/models/Gym";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function POST(req: NextRequest) {
  try {
    const current = getDataFromToken(req);
    if (!current || current.role !== "superadmin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, address, phone, adminEmail, adminPassword, adminName } = await req.json();
    if (!name || !adminEmail || !adminPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const exists = await User.findOne({ email: adminEmail });
    if (exists) return NextResponse.json({ error: "Email exists" }, { status: 409 });

    const gym = await Gym.create({ name, address, phone, createdBy: current.id });
    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = await User.create({ username: adminName || adminEmail.split("@")[0], email: adminEmail, password: hashed, role: "admin", gym: gym._id, createdBy: current.id, status: "approved" });
    gym.admin = admin._id;
    await gym.save();

    const safe = { ...admin.toObject() }; delete safe.password;
    return NextResponse.json({ message: "Created", gym, admin: safe });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
