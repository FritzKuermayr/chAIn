"use client";
import { CATEGORY_LABEL, Severity, Span } from "@/lib/types";

function severityClass(sev: Severity): string {
  switch (sev) {
    case "CRITICAL":
      return "sev-critical";
    case "SENSITIVE":
      return "sev-sensitive";
    case "REVIEW":
      return "sev-review";
    default:
      return "";
  }
}

function spanTitle(s: Span): string {
  const cat = CATEGORY_LABEL[s.category] ?? s.category;
  const sub = s.subcategory ? ` / ${s.subcategory}` : "";
  const note = s.note ? ` — ${s.note}` : "";
  return `${s.severity} · ${cat}${sub}${note}`;
}

export function HighlightedText({
  text,
  spans,
  excluded,
  onToggle,
}: {
  text: string;
  spans: Span[];
  excluded: Set<number>;
  onToggle?: (idx: number) => void;
}) {
  if (!spans.length) {
    return <pre className="whitespace-pre-wrap text-sm leading-6">{text}</pre>;
  }
  const sorted = [...spans]
    .map((s, i) => ({ ...s, _i: i }))
    .sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let cur = 0;
  for (const s of sorted) {
    if (s.start > cur) out.push(text.slice(cur, s.start));
    const isExcluded = excluded.has(s._i);
    out.push(
      <mark
        key={`${s._i}-${s.start}`}
        className={`sev ${severityClass(s.severity)} ${isExcluded ? "excluded" : ""}`}
        title={spanTitle(s)}
        onClick={() => onToggle?.(s._i)}
      >
        {text.slice(s.start, s.end)}
      </mark>,
    );
    cur = s.end;
  }
  if (cur < text.length) out.push(text.slice(cur));
  return (
    <pre className="whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
      {out}
    </pre>
  );
}
