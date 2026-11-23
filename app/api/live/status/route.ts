import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isLiveConfigured } from "@/lib/live/config";
import { COOKIE_NAME, verifySessionToken } from "@/lib/live/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isLiveConfigured()) return NextResponse.json({ available: false, unlocked: false });
  const jar = await cookies();
  return NextResponse.json({
    available: true,
    unlocked: verifySessionToken(jar.get(COOKIE_NAME)?.value),
  });
}
