import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByUsername } from "@/lib/db/ledger";
import { OriginType } from "@/lib/game/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, origin } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Valid username is required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    let user = await getUserByUsername(cleanUsername);

    if (!user) {
      if (!origin) {
        return NextResponse.json({ error: "Origin background required for new player" }, { status: 400 });
      }
      user = await createUser(cleanUsername, origin as OriginType);
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
