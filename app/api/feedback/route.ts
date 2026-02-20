import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FEEDBACK_FILE = path.join(process.cwd(), "feedback.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = {
      message: String(body.message || "").slice(0, 2000),
      email: body.email ? String(body.email).slice(0, 200) : null,
      timestamp: body.timestamp || new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for") || "unknown",
    };

    // Read existing feedback
    let existing: any[] = [];
    try {
      const data = await fs.readFile(FEEDBACK_FILE, "utf-8");
      existing = JSON.parse(data);
    } catch {
      // file doesn't exist yet
    }

    existing.push(entry);
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(existing, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json([]);
  }
}
