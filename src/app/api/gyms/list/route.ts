import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import Gym from "@/models/Gym";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function GET(req: NextRequest) {
  try {
    const current = getDataFromToken(req);
    if (!current || current.role !== "superadmin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const gyms = await Gym.find().populate("admin", "email username").lean();
    return NextResponse.json({ gyms });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
