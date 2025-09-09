import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import RequestModel from "@/models/Request";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function POST(req: NextRequest) {
  try {
    const cur = getDataFromToken(req);
    if (!cur || !["admin", "superadmin"].includes(cur.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action, setPassword } = await req.json();

    if (!requestId || !["approve", "reject"].includes(action))
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const doc = await RequestModel.findById(requestId);
    if (!doc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "reject") {
      doc.status = "rejected";
      await doc.save();
      return NextResponse.json({ message: "Request rejected" });
    }

    // Approve
    if (cur.role === "admin" && doc.gym && String(doc.gym) !== String(cur.gym))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let hashed = doc.hashedPassword;
    if (!hashed) {
      if (!setPassword) return NextResponse.json({ error: "Password required to approve" }, { status: 400 });
      hashed = await bcrypt.hash(setPassword, 10);
    }

    const finalGym = doc.gym || cur.gym;

    const user = await User.create({
      username: doc.name || doc.fullName || doc.email.split("@")[0],
      email: doc.email,
      password: hashed,
      role: doc.role,
      gym: finalGym,
      createdBy: cur.id,
      status: "approved",
    });

    doc.status = "approved";
    await doc.save();

    const safe = user.toObject();
    delete safe.password;

    return NextResponse.json({ message: "User approved", user: safe });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
