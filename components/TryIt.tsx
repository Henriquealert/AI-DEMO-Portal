"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoOutput } from "@/lib/blocks";
import { OutputBlocks } from "./OutputBlocks";
import { CsvTable, TextPreview } from "./InputPreview";

type Sample = { id: string; label: string; input: string; output: DemoOutput };
type Context = { label: string; format: "text" | "csv"; content: string };
type TryItConfig = {
  inputLabel: string;
  inputFormat: "text" | "csv";
  placeholder: string;
  maxChars: number;
  acceptUpload: boolean;
};

type Props = {
  slug: string;
  tryIt: TryItConfig;
  samples: Sample[];
  context: Context[];
  stepLabels: string[];
  /** True when the server has an API key and access code configured. */
  liveAvailable: boolean;
};

type Mode = "sample" | "live";
type RunState =
  | { kind: "idle" }
  | { kind: "running"; progress: number; step: number }
  | { kind: "done"; output: DemoOutput; source: Mode }
  | { kind: "error"; message: string };

const UPLOAD_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_UPLOAD = 4 * 1024 * 1024;

export function TryIt({ slug, tryIt, samples, context, stepLabels, liveAvailable }: Props) {
  const [mode, setMode] = useState<Mode>("sample");
  const [sampleId, setSampleId] = useState(samples[0]!.id);
  const [run, setRun] = useState<RunState>({ kind: "idle" });
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [liveText, setLiveText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const timers = useRef<number[]>([]);
  const outRef = useRef<HTMLDivElement>(null);

  const sample = samples.find((s) => s.id === sampleId) ?? samples[0]!;

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    if (mode !== "live" || unlocked !== null) return;
    fetch("/api/live/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { unlocked?: boolean }) => setUnlocked(Boolean(d.unlocked)))
      .catch(() => setUnlocked(false));
  }, [mode, unlocked]);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function focusOutput() {
    window.setTimeout(() => outRef.current?.focus({ preventScroll: false }), 0);
  }

  function runSample() {
    clearTimers();
    const total = 1600;
    const steps = Math.max(1, stepLabels.length - 1);
    setRun({ kind: "running", progress: 0, step: 0 });
    for (let i = 1; i <= 8; i++) {
      timers.current.push(
        window.setTimeout(() => {
          const progress = i / 8;
          setRun({ kind: "running", progress, step: Math.min(steps - 1, Math.floor(progress * steps)) });
        }, (total / 8) * i - 100),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        setRun({ kind: "done", output: sample.output, source: "sample" });
        focusOutput();
      }, total),
    );
  }

  async function runLive() {
    clearTimers();
    if (!file && !liveText.trim()) {
      setRun({ kind: "error", message: "Add some input first, or load a sample into the box." });
      return;
    }
    setRun({ kind: "running", progress: 0.15, step: 0 });
    timers.current.push(window.setTimeout(() => setRun({ kind: "running", progress: 0.5, step: 1 }), 1500));
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("text", liveText);
        fd.append("file", file);
        res = await fetch(`/api/live/${slug}`, { method: "POST", body: fd });
      } else {
        res = await fetch(`/api/live/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: liveText }),
        });
      }
      clearTimers();
      const data = (await res.json().catch(() => ({}))) as DemoOutput & { error?: string };
      if (!res.ok) {
        if (res.status === 401) setUnlocked(false);
        setRun({ kind: "error", message: data.error || "Live mode is unavailable right now." });
        return;
      }
      setRun({ kind: "done", output: data, source: "live" });
      focusOutput();
    } catch {
      clearTimers();
      setRun({ kind: "error", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setCodeError("");
    const res = await fetch("/api/live/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    if (res?.ok) {
      setUnlocked(true);
      setCode("");
      if (!liveText) setLiveText(sample.input.slice(0, tryIt.maxChars));
    } else {
      const d = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setCodeError(d?.error || "That access code is not valid.");
    }
  }

  function switchMode(m: Mode) {
    clearTimers();
    setMode(m);
    setRun({ kind: "idle" });
    if (m === "live" && !liveText) setLiveText(sample.input.slice(0, tryIt.maxChars));
  }

  function chooseSample(id: string) {
    clearTimers();
    setSampleId(id);
    setRun({ kind: "idle" });
  }

  function onFile(f: File | null) {
    if (f && f.size > MAX_UPLOAD) {
      setRun({ kind: "error", message: "File is too large. The limit is 4 MB." });
      setFile(null);
      return;
    }
    setFile(f);
  }

  const running = run.kind === "running";
  const overLimit = liveText.length > tryIt.maxChars;

  return (
    <div className="tryit">
      <div className="tryit-bar">
        {liveAvailable ? (
          <div className="mode-switch" role="group" aria-label="Demo mode">
            <button type="button" aria-pressed={mode === "sample"} onClick={() => switchMode("sample")}>
              Sample
            </button>
            <button type="button" aria-pressed={mode === "live"} onClick={() => switchMode("live")}>
              Live
            </button>
          </div>
        ) : (
          <span className="label label-muted">Sample mode</span>
        )}
        <span className="hint">
          {mode === "sample"
            ? "Plays back output generated in advance from fictional data."
            : "Runs Claude on your input. Use fictional data only."}
        </span>
      </div>

      <div className="tryit-panes">
        {/* ---------- Input ---------- */}
        <div className="pane">
          <div className="pane-head">
            <h3 className="label">Input</h3>
          </div>

          {mode === "sample" && (
            <>
              <div className="field">
                <label htmlFor={`${slug}-sample`} className="label label-muted">
                  Choose a sample
                </label>
                <select
                  id={`${slug}-sample`}
                  className="select"
                  value={sampleId}
                  onChange={(e) => chooseSample(e.target.value)}
                >
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span className="label label-muted">{tryIt.inputLabel}</span>
                {tryIt.inputFormat === "csv" ? (
                  <CsvTable csv={sample.input} caption={`${tryIt.inputLabel}: ${sample.label}`} />
                ) : (
                  <TextPreview
                    text={sample.input}
                    caption={`${tryIt.inputLabel}: ${sample.label}`}
                    wrap={!/ {3,}/.test(sample.input)}
                  />
                )}
              </div>
              <div className="run-row">
                <button type="button" className="btn btn-primary" onClick={runSample} disabled={running}>
                  {running ? "Running…" : "Try the Demo"}
                </button>
                {tryIt.acceptUpload && (
                  <span className="hint">Uploading your own file is available in live mode.</span>
                )}
              </div>
            </>
          )}

          {mode === "live" && unlocked === null && <p className="hint">Checking access…</p>}

          {mode === "live" && unlocked === false && (
            <form onSubmit={unlock} className="field" style={{ gap: 10 }}>
              <label htmlFor={`${slug}-code`} className="label label-muted">
                Access code
              </label>
              <p className="hint">Live mode is available to invited visitors. Enter the code you were given.</p>
              <input
                id={`${slug}-code`}
                className="input"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={200}
                required
              />
              {codeError && (
                <p className="error-msg" role="alert">
                  {codeError}
                </p>
              )}
              <div className="run-row">
                <button type="submit" className="btn btn-primary">
                  Unlock Live Mode
                </button>
              </div>
            </form>
          )}

          {mode === "live" && unlocked === true && (
            <>
              <div className="field">
                <label htmlFor={`${slug}-sample-live`} className="label label-muted">
                  Start from a sample
                </label>
                <select
                  id={`${slug}-sample-live`}
                  className="select"
                  value={sampleId}
                  onChange={(e) => {
                    chooseSample(e.target.value);
                    const s = samples.find((x) => x.id === e.target.value);
                    if (s) setLiveText(s.input.slice(0, tryIt.maxChars));
                  }}
                >
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`${slug}-text`} className="label label-muted">
                  {tryIt.inputLabel}
                </label>
                <textarea
                  id={`${slug}-text`}
                  className="textarea"
                  value={liveText}
                  placeholder={tryIt.placeholder}
                  onChange={(e) => setLiveText(e.target.value)}
                  aria-describedby={`${slug}-count`}
                  spellCheck={false}
                />
                <span id={`${slug}-count`} className="hint num" aria-live="polite">
                  {liveText.length.toLocaleString("en-US")} / {tryIt.maxChars.toLocaleString("en-US")} characters
                  {overLimit && " (over the limit)"}
                </span>
              </div>
              {tryIt.acceptUpload && (
                <div className="field">
                  <label htmlFor={`${slug}-file`} className="label label-muted">
                    Or upload a file (PDF, PNG, JPEG, WebP, up to 4 MB)
                  </label>
                  <input
                    id={`${slug}-file`}
                    type="file"
                    accept={UPLOAD_ACCEPT}
                    className="input"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                  />
                  {file && <span className="hint">The file is used instead of the text box.</span>}
                </div>
              )}
              <div className="run-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runLive}
                  disabled={running || overLimit}
                >
                  {running ? "Running…" : "Run Live"}
                </button>
                <span className="hint">Use fictional data only. Your input is sent to Claude to generate the result and is not stored by this site.</span>
              </div>
            </>
          )}

          {context.map((c) => (
            <details key={c.label} className="ref">
              <summary>
                <span className="label label-muted">Reference data: {c.label}</span>
              </summary>
              <div>
                {c.format === "csv" ? (
                  <CsvTable csv={c.content} caption={c.label} />
                ) : (
                  <TextPreview text={c.content} caption={c.label} wrap />
                )}
              </div>
            </details>
          ))}
        </div>

        {/* ---------- Output ---------- */}
        <div className="pane" ref={outRef} tabIndex={-1} aria-live="polite" aria-busy={running}>
          <div className="pane-head">
            <h3 className="label">Output</h3>
            {run.kind === "done" && (
              <span className="tag tag-status">{run.source === "sample" ? "Sample output" : "Live output"}</span>
            )}
          </div>

          {run.kind === "idle" && (
            <div className="placeholder-out">
              {mode === "sample"
                ? "Choose a sample and select Try the Demo. The result appears here."
                : "Run live mode to see Claude's output for your input here."}
            </div>
          )}

          {run.kind === "running" && (
            <div className="processing" role="status">
              <span className="label">Processing</span>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${Math.round(run.progress * 100)}%` }} />
              </div>
              <span className="hint">
                {stepLabels[Math.min(run.step + 1, stepLabels.length - 1)] ?? "Working"}…
              </span>
            </div>
          )}

          {run.kind === "error" && (
            <p className="error-msg" role="alert">
              {run.message}
            </p>
          )}

          {run.kind === "done" && <OutputBlocks blocks={run.output.blocks} idPrefix={`${slug}-out`} />}
        </div>
      </div>
    </div>
  );
}
