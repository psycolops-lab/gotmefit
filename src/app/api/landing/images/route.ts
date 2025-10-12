import { NextResponse } from "next/server";
import { listPublicImages } from "../../../../lib/listPublicImages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dir = searchParams.get("dir")?.replace(/^\/+|\/+$/g, "") || "";
  const images = listPublicImages(dir);
  return NextResponse.json({ images });
}
