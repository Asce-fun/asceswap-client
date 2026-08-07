import { NextResponse } from "next/server";

import { normalizeEmail, saveEmail } from "../../waitlist/store";

export async function POST(request: Request) {
  let email: unknown;
  let exposure: unknown;

  try {
    ({ email, exposure } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }

  try {
    const status = await saveEmail(
      normalizedEmail,
      typeof exposure === "string" ? exposure : undefined,
    );
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json(
      { error: "Could not save you right now. Try again." },
      { status: 502 },
    );
  }
}
