"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  CATEGORY_LABEL,
  ClassifyResponse,
  ModelChoice,
  ReplacementMode,
  RewriteResponse,
  Severity,
  Span,
} from "@/lib/types";
import { HighlightedText } from "./HighlightedText";

export type GatewayResult = {
  original: string;
  rewritten: string;
  spans: Span[];
  excluded: number[];
  approved: boolean;
};

export function GatewayFlow({
  initialText = "",
  onApprove,
  approveLabel = "Approve",
  compact = false,
}: {
  initialText?: string;
  onApprove?: (r: GatewayResult) => void;
  approveLabel?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState(initialText);
  const [editedRewrite, setEditedRewrite] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [model, setModel] = useState<ModelChoice>("openai");
  const [mode, setMode] = useState<ReplacementMode>("placeholder");
  const [busy, setBusy] = useState<"idle" | "classify" | "rewrite">("idle");
  const [classify, setClassify] = useState<ClassifyResponse | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [rewrite, setRewrite] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inflight = useRef(0);

  function toggle(i: number) {
    setExcluded((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  async function onUpload(file: File) {
    try {
      const r = await api.extract(file);
      setText(r.text);
      setClassify(null);
      setRewrite(null);
      setEditedRewrite(null);
      setIsEditing(false);
    } catch (e) {
      setError(String(e));
    }
  }

  async function runAnalyze() {
    if (!text.trim()) return;
    const myToken = ++inflight.current;
    setError(null);
    setRewrite(null);
    setEditedRewrite(null);
    setIsEditing(false);
    setBusy("classify");
    try {
      const c = await api.classify(text, model);
      if (myToken !== inflight.current) return;
      setClassify(c);
      setExcluded(new Set());
      setBusy("rewrite");
      const r = await api.rewrite({
        text,
        spans: c.spans,
        excluded: [],
        mode,
        recipient: "Other",
        model,
      });
      if (myToken !== inflight.current) return;
      setRewrite(r);
    } catch (e) {
      if (myToken !== inflight.current) return;
      setError(String(e));
    } finally {
      if (myToken === inflight.current) setBusy("idle");
    }
  }

  async function rerunRewrite() {
    if (!classify) return;
    const myToken = ++inflight.current;
    setBusy("rewrite");
    setError(null);
    try {
      const r = await api.rewrite({
        text,
        spans: classify.spans,
        excluded: [...excluded],
        mode,
        recipient: "Other",
        model,
      });
      if (myToken !== inflight.current) return;
      setRewrite(r);
      setEditedRewrite(null);
      setIsEditing(false);
    } catch (e) {
      if (myToken !== inflight.current) return;
      setError(String(e));
    } finally {
      if (myToken === inflight.current) setBusy("idle");
    }
  }

  function approve() {
    if (!rewrite || !classify) return;
    onApprove?.({
      original: text,
      rewritten: editedRewrite ?? rewrite.rewritten,
      spans: classify.spans,
      excluded: [...excluded],
      approved: true,
    });
  }

  const overall = classify?.overall;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded border border-[var(--critical)] bg-[var(--critical-bg)] p-3 text-sm text-[var(--critical)]">
          {error}
        </div>
      )}

      <section className="rounded-xl border bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <Field label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelChoice)}
              className="rounded border px-2 py-1"
            >
              <option value="openai">OpenAI</option>
              <option value="kimi">Kimi K2.6 (Tinker)</option>
            </select>
          </Field>
          <Field label="Replace with">
            <div className="flex rounded border">
              <button
                onClick={() => setMode("placeholder")}
                className={`px-3 py-1 ${mode === "placeholder" ? "bg-[var(--accent)] text-white" : ""}`}
              >
                Placeholder
              </button>
              <button
                onClick={() => setMode("dummy")}
                className={`px-3 py-1 ${mode === "dummy" ? "bg-[var(--accent)] text-white" : ""}`}
              >
                Dummy data
              </button>
            </div>
          </Field>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the message, draft, or extracted text…"
          className={`w-full resize-y rounded-lg border bg-white p-3 text-sm leading-6 ${compact ? "min-h-[160px]" : "min-h-[240px]"}`}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded border px-3 py-1.5 text-sm hover:bg-[var(--line)]/40">
            Upload PDF / DOCX / TXT
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
              className="hidden"
            />
          </label>
          {text.trim() && (
            <button
              onClick={() => {
                setText("");
                setClassify(null);
                setRewrite(null);
              }}
              className="rounded border px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--line)]/40"
            >
              Clear
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={runAnalyze}
            disabled={!text.trim() || busy !== "idle"}
            className="rounded bg-[var(--accent)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy === "idle"
              ? "Analyze"
              : busy === "classify"
                ? "Classifying…"
                : "Rewriting…"}
          </button>
        </div>
      </section>

      {classify && (
        <section className="rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-3 text-sm">
            <div className="flex items-center gap-3">
              <SeverityPill severity={overall ?? "SAFE"} />
              <span className="text-[var(--muted)]">
                {classify.spans.length} item
                {classify.spans.length === 1 ? "" : "s"} flagged
              </span>
            </div>
            <button
              onClick={rerunRewrite}
              disabled={busy !== "idle"}
              className="rounded border px-3 py-1 text-sm hover:bg-[var(--line)]/40 disabled:opacity-50"
            >
              Re-run rewrite
            </button>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <div className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">
                Original
              </div>
              <HighlightedText
                text={text}
                spans={classify.spans}
                excluded={excluded}
                onToggle={toggle}
              />
            </div>
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  Rewritten
                  {rewrite && editedRewrite !== null && editedRewrite !== rewrite.rewritten && (
                    <span className="rounded bg-[var(--brand-ai)]/15 px-1.5 py-0.5 text-[9px] tracking-normal text-[var(--brand-ai)]">
                      edited
                    </span>
                  )}
                </span>
                {rewrite && (
                  <div className="flex items-center gap-1">
                    {editedRewrite !== null && editedRewrite !== rewrite.rewritten && (
                      <button
                        onClick={() => {
                          setEditedRewrite(null);
                          setIsEditing(false);
                        }}
                        className="rounded border px-2 py-0.5 text-[10px] tracking-normal"
                        title="Discard manual edits and restore the model output"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setIsEditing(false);
                        } else {
                          if (editedRewrite === null) {
                            setEditedRewrite(rewrite.rewritten);
                          }
                          setIsEditing(true);
                        }
                      }}
                      className="rounded border px-2 py-0.5 text-[10px] tracking-normal"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>
                )}
              </div>
              {!rewrite ? (
                <div className="text-sm text-[var(--muted)]">
                  {busy === "rewrite" ? "Rewriting…" : "—"}
                </div>
              ) : isEditing ? (
                <textarea
                  value={editedRewrite ?? rewrite.rewritten}
                  onChange={(e) => setEditedRewrite(e.target.value)}
                  className="w-full rounded border p-2 text-sm leading-6"
                  rows={Math.max(8, (editedRewrite ?? rewrite.rewritten).split("\n").length + 1)}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
                  {editedRewrite ?? rewrite.rewritten}
                </pre>
              )}
            </div>
          </div>

          <div className="grid gap-0 border-t md:grid-cols-2">
            <div className="border-b p-5 md:border-b-0 md:border-r">
              <div className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">
                Flagged items
              </div>
              {classify.spans.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">Nothing flagged.</div>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {classify.spans.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={!excluded.has(i)}
                        onChange={() => toggle(i)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SeverityDot severity={s.severity} />
                          <span className="rounded bg-[var(--line)]/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                            {CATEGORY_LABEL[s.category]}
                            {s.subcategory ? ` · ${s.subcategory}` : ""}
                          </span>
                          <span className="truncate">{s.text}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-5">
              <div className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">
                Mapping
              </div>
              {!rewrite || !rewrite.mapping.length ? (
                <div className="text-sm text-[var(--muted)]">—</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {rewrite.mapping.map((m, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-1 pr-2 text-[var(--muted)]">
                          {m.original}
                        </td>
                        <td className="py-1 pl-2">{m.replacement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {rewrite && onApprove && (
            <div className="flex items-center justify-end gap-2 border-t bg-[var(--line)]/20 px-5 py-3">
              <span className="mr-auto text-xs text-[var(--muted)]">
                Review before this leaves your perimeter.
              </span>
              <button
                onClick={approve}
                className="rounded bg-[var(--accent)] px-4 py-1.5 text-sm text-white"
              >
                {approveLabel}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function SeverityPill({ severity }: { severity: Severity }) {
  const tones: Record<Severity, string> = {
    SAFE: "bg-[var(--sev-safe-bg)] text-[var(--sev-safe)]",
    REVIEW: "bg-[var(--sev-review-bg)] text-[var(--sev-review)]",
    SENSITIVE: "bg-[var(--sev-sensitive-bg)] text-[var(--sev-sensitive)]",
    CRITICAL: "bg-[var(--sev-critical-bg)] text-[var(--sev-critical)]",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${tones[severity]}`}
    >
      {severity}
    </span>
  );
}

function SeverityDot({ severity }: { severity: Severity }) {
  const tones: Record<Severity, string> = {
    SAFE: "bg-[var(--sev-safe)]",
    REVIEW: "bg-[var(--sev-review)]",
    SENSITIVE: "bg-[var(--sev-sensitive)]",
    CRITICAL: "bg-[var(--sev-critical)]",
  };
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${tones[severity]}`}
      title={severity}
    />
  );
}
