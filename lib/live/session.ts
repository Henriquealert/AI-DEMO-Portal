import "server-only";
import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { LIMITS } from "./config";

export const COOKIE_NAME = "alert_live";

function secret() {
  const s = process.env.LIVE_SESSION_SECRET || process.env.LIVE_ACCESS_CODE || "";
  return createHash("sha256").update("alert-live-session:" + s).digest();
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Hash both sides so lengths match and timing does not leak length.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAccessCode(code: string) {
  const expected = process.env.LIVE_ACCESS_CODE;
  if (!expected) return false;
  return safeEqual(code.trim(), expected);
}

export function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + LIMITS.sessionSeconds;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload))) return false;
  return Number(payload) > Math.floor(Date.now() / 1000);
}
