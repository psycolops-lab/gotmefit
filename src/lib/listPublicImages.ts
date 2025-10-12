import fs from "fs";
import path from "path";

const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export function listPublicImages(relDir: string): string[] {
  try {
    const publicRoot = path.join(process.cwd(), "public");
    const abs = path.join(publicRoot, relDir);
    if (!fs.existsSync(abs)) return [];
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && IMG_EXT.has(path.extname(e.name).toLowerCase()))
      .map((e) => "/" + path.join(relDir, e.name).replace(/\\/g, "/"));
  } catch {
    return [];
  }
}
