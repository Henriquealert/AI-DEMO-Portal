import { NextResponse } from "next/server";
import { isLiveConfigured, LIMITS } from "@/lib/live/config";
import { checkAccessCode, createSessionToken, COOKIE_NAME } from "@/lib/live/session";
import { clientIp, rateLimit } from "@/lib/live/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isLiveConfigured()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rl = await rateLimit(`unlock:${clientIp(req.headers)}`, LIMITS.unlockAttempts, 15 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 200) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!checkAccessCode(code)) {
    return NextResponse.json({ error: "That access code is not valid." }, { status: 401 });
  }

  const res = NextResponse.json({ unlocked: true });
  res.cookies.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: LIMITS.sessionSeconds,
  });
  return res;
}
