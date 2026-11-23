import "server-only";

/**
 * Live mode is available only when an API key AND an access code are set.
 * Without both, the UI hides live mode and the API routes return 404.
 */
export function isLiveConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.LIVE_ACCESS_CODE);
}

export const LIVE_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export const LIMITS = {
  /** Requests per IP per hour for live runs. */
  runsPerHour: Number(process.env.LIVE_RATE_LIMIT_PER_HOUR) || 10,
  /** Access-code attempts per IP per 15 minutes. */
  unlockAttempts: 5,
  /** Uploaded files (document-intake). */
  maxUploadBytes: 4 * 1024 * 1024,
  uploadTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const,
  /** Cookie lifetime after unlocking. */
  sessionSeconds: 60 * 60 * 8,
};
