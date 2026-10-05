import { NextRequest, NextResponse } from "next/server";
import { handleGameAction } from "@/lib/game/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action payload" }, { status: 400 });
    }

    const updatedUser = await handleGameAction(userId, action);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
