import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { getDemo, loadContext, loadPrompt } from "@/lib/demos";
import { isLiveConfigured, LIMITS, LIVE_MODEL } from "@/lib/live/config";
import { COOKIE_NAME, verifySessionToken } from "@/lib/live/session";
import { clientIp, rateLimit } from "@/lib/live/rate-limit";
import { BLOCKS_JSON_SCHEMA, type DemoOutput } from "@/lib/blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fail(message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!isLiveConfigured()) return fail("Not found", 404);

  const { slug } = await ctx.params;
  const demo = getDemo(slug);
  if (!demo || !demo.live.enabled) return fail("Not found", 404);

  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return fail("Enter the access code to use live mode.", 401);
  }

  const rl = await rateLimit(`run:${clientIp(req.headers)}`, LIMITS.runsPerHour, 60 * 60);
  if (!rl.ok) {
    return fail("Live mode limit reached for this hour. Sample mode is still available.", 429, {
      "Retry-After": String(rl.retryAfter),
    });
  }

  // ---- Read and validate input ----
  let text = "";
  let file: File | null = null;
  const type = req.headers.get("content-type") || "";
  try {
    if (type.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const t = form.get("text");
      text = typeof t === "string" ? t : "";
      const f = form.get("file");
      file = f instanceof File && f.size > 0 ? f : null;
    } else {
      const body = (await req.json()) as { text?: unknown };
      text = typeof body.text === "string" ? body.text : "";
    }
  } catch {
    return fail("Invalid request.", 400);
  }

  text = text.trim();
  if (text.length > demo.tryIt.maxChars) {
    return fail(`Input is too long. The limit for this demo is ${demo.tryIt.maxChars.toLocaleString("en-US")} characters.`, 413);
  }

  const content: Anthropic.ContentBlockParam[] = [];
  if (file) {
    if (!demo.tryIt.acceptUpload) return fail("This demo does not accept file uploads.", 400);
    if (file.size > LIMITS.maxUploadBytes) return fail("File is too large. The limit is 4 MB.", 413);
    const mime = file.type as (typeof LIMITS.uploadTypes)[number];
    if (!LIMITS.uploadTypes.includes(mime)) {
      return fail("Upload a PDF, PNG, JPEG or WebP file.", 415);
    }
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (mime === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: mime, data } });
    } else {
      content.push({ type: "image", source: { type: "base64", media_type: mime, data } });
    }
  }
  if (!file && !text) return fail("Add some input first.", 400);

  // Reference data (price list, handbook, purchase orders...) is part of the demo.
  const reference = loadContext(demo)
    .map((c) => `<reference label="${c.label}" format="${c.format}">\n${c.content}\n</reference>`)
    .join("\n\n");

  const userText = [
    reference,
    text ? `<input>\n${text}\n</input>` : "The input is the attached file.",
  ]
    .filter(Boolean)
    .join("\n\n");
  content.push({ type: "text", text: userText });

  // ---- Call Claude ----
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000, maxRetries: 1 });

  try {
    const response = await client.beta.messages.create({
      model: LIVE_MODEL,
      max_tokens: 16000,
      system: loadPrompt(demo),
      messages: [{ role: "user", content }],
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: BLOCKS_JSON_SCHEMA },
      },
      // Route a safety-classifier refusal to a fallback model server-side.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return fail("The model declined this input. Try a different sample.", 422);
    }
    if (response.stop_reason === "max_tokens") {
      return fail("The input produced too much output. Try a shorter input.", 422);
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return fail("No output returned. Try again.", 502);

    const output = JSON.parse(textBlock.text) as DemoOutput;
    if (!Array.isArray(output.blocks)) return fail("Unexpected output. Try again.", 502);

    return NextResponse.json(output, {
      headers: { "Cache-Control": "no-store", "X-RateLimit-Remaining": String(rl.remaining) },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return fail("Live mode is busy. Try again in a minute.", 503);
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Live mode API error", err.status, err.message);
      return fail("Live mode is unavailable right now. Sample mode still works.", 502);
    }
    console.error("Live mode error", err);
    return fail("Something went wrong. Try again.", 500);
  }
}
