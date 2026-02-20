import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "icon", "screenshot", "video"

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload directory
  const uploadDir = path.join(process.cwd(), "public", "uploads", type || "misc");
  await mkdir(uploadDir, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  const url = `/uploads/${type || "misc"}/${filename}`;
  return NextResponse.json({ url, filename });
}
