// src/app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RequestRow = {
  id: number;
  email: string;
  name?: string;
  role: string;
  gym_id?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, gymId } = await req.json();
    if (!email || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("requests")
      .insert([{ email, name, role, gym_id: gymId }])
      .select(); // Ensure data is returned

    const typedData = data as RequestRow[] | null;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!typedData || !typedData[0]) return NextResponse.json({ error: "No data returned" }, { status: 500 });
    return NextResponse.json({ message: "Request created", id: typedData[0].id });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
