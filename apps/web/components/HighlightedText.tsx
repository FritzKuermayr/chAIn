"use client";
import { CATEGORY_LABEL, Span } from "@/lib/types";

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
        className={`crit ${isExcluded ? "excluded" : ""}`}
        title={`${CATEGORY_LABEL[s.category]}${s.note ? " — " + s.note : ""}`}
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
