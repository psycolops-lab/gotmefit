import fs from "fs";
import path from "path";

const SUPPORTED_EXT = new Set([
  // Images
  ".png", ".jpg", ".jpeg", ".webp", ".gif",
  // Videos
  ".mp4", ".webm", ".mov"
]);

export function listPublicImages(relDir: string): string[] {
  try {
    const publicRoot = path.join(process.cwd(), "public");
    const abs = path.join(publicRoot, relDir);
    
    if (!fs.existsSync(abs)) {
      console.error(`Directory not found: ${abs}`);
      return [];
    }
    
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && SUPPORTED_EXT.has(path.extname(e.name).toLowerCase()))
      .map((e) => "/" + path.join(relDir, e.name).replace(/\\/g, "/"));
    
    console.log(`Found ${files.length} files in ${abs}:`, files);
    return files;
  } catch (error) {
    console.error(`Error listing files in ${relDir}:`, error);
    return [];
  }
}