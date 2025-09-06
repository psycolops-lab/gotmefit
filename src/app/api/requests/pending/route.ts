import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import RequestModel from "@/models/Request";
import { getDataFromToken } from "@/helpers/detDataFromToken";

connect();

export async function GET(req: NextRequest) {
  try {
    const cur = getDataFromToken(req);
    console.log("GET /requests/pending - token user:", cur);

    if (!cur || !["admin", "superadmin"].includes(cur.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter: any = { status: "pending" };

    if (cur.role === "admin") {
      if (!cur.gym) {
        console.warn("Admin has no gym assigned, returning empty list");
        return NextResponse.json({ requests: [] });
      }
      // ensure type match: store as ObjectId in DB, cur.gym may be string
      filter.gym = cur.gym;
    }

    console.log("Filtering pending requests with:", filter);
    const list = await RequestModel.find(filter).populate("gym", "name").sort({ createdAt: -1 }).lean();
    console.log("Found pending requests:", list.length);

    return NextResponse.json({ requests: list });
  } catch (err: any) {
    console.error("Error in /requests/pending:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
