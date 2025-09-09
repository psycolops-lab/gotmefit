// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/User";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function GET(req: NextRequest) {
  try {
    const cur = getDataFromToken(req);
    if (!cur || !["admin","superadmin"].includes(cur.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter: any = {};
    if (cur.role === "admin") {
      filter.gym = cur.gym;
    }

    // include profile
    const users = await User.find(filter)
      .select("name email role gym profile createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (err:any) {
    console.error("Error in GET /api/users:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
