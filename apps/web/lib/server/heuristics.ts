import type { Category, Span } from "../types";

const PATTERNS: Array<{ category: Category; pattern: RegExp }> = [
  { category: "api_key", pattern: /sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|xox[bp]-[A-Za-z0-9-]{10,}/g },
  { category: "api_key", pattern: /\b[A-Fa-f0-9]{32,64}\b/g },
  { category: "password", pattern: /password\s*[:=]\s*\S+/gi },
  { category: "tax_id", pattern: /\bDE\d{9}\b|\bATU\d{8}\b|\b\d{3}-\d{2}-\d{4}\b/g },
  { category: "account", pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g },
  { category: "account", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
  { category: "contact", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { category: "contact", pattern: /\+?\d[\d\s\-().]{7,}\d/g },
  { category: "address", pattern: /\b\d{1,4}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(?:Street|St|Road|Rd|Avenue|Ave|Stra(ß|ss)e|Str\.)\b/g },
  { category: "address", pattern: /\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+\b/g },
  { category: "identifier", pattern: /\b(?:invoice|case|claim|ticket)\s*#?\s*[A-Z0-9-]{3,}\b/gi },
  { category: "medical", pattern: /\b(ICD-?10|diagnosis|prescription|patient ID)\b[^\n.]{0,40}/gi },
  { category: "name", pattern: /\b(?:Mr|Mrs|Ms|Dr|Herr|Frau)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g },
];

export function findSpans(text: string): Span[] {
  const raw: Span[] = [];
  for (const { category, pattern } of PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      raw.push({
        start,
        end,
        text: m[0],
        category,
        severity: "CRITICAL",
      });
    }
  }
  raw.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const keep: Span[] = [];
  for (const s of raw) {
    const last = keep[keep.length - 1];
    if (last && s.start < last.end) {
      if (s.end - s.start > last.end - last.start) {
        keep[keep.length - 1] = s;
      }
      continue;
    }
    keep.push(s);
  }
  return keep;
}

export function localPlaceholder(category: Category, idx: number): string {
  const base: Record<Category, string> = {
    name: "Person",
    address: "Address",
    tax_id: "Tax ID",
    account: "Bank Account",
    password: "Password",
    api_key: "API key",
    medical: "Medical Detail",
    identifier: "Reference",
    contact: "Contact",
    other: "Detail",
  };
  return `${base[category] ?? "Detail"} ${String.fromCharCode(65 + (idx % 26))}`;
}

export function localDummy(category: Category, idx: number): string {
  const fakes: Record<Category, string[]> = {
    name: ["John Doe", "Jane Roe", "Sam Quinn"],
    address: ["1 Example Street, 00000 Sample City"],
    tax_id: ["DE000000000"],
    account: ["DE00 0000 0000 0000 0000 00"],
    password: ["•••••••••"],
    api_key: ["sk-test-dummy-0000000000000000"],
    medical: ["unspecified clinical condition"],
    identifier: [`REF-${1000 + idx}`],
    contact: ["user@example.com"],
    other: ["redacted"],
  };
  const pool = fakes[category] ?? ["redacted"];
  return pool[idx % pool.length];
}

export function localRewrite(
  text: string,
  spans: Span[],
  mode: "placeholder" | "dummy",
): { rewritten: string; mapping: Array<{ original: string; replacement: string; category: Category }> } {
  if (!spans.length) return { rewritten: text, mapping: [] };
  const pick = mode === "dummy" ? localDummy : localPlaceholder;
  const byText = new Map<string, string>();
  const mapping: Array<{ original: string; replacement: string; category: Category }> = [];
  spans.forEach((s, i) => {
    if (byText.has(s.text)) return;
    const repl = pick(s.category, i);
    byText.set(s.text, repl);
    mapping.push({ original: s.text, replacement: repl, category: s.category });
  });
  const ordered = [...spans].sort((a, b) => b.start - a.start);
  let out = text;
  for (const s of ordered) {
    const repl = byText.get(s.text);
    if (repl == null) continue;
    out = out.slice(0, s.start) + repl + out.slice(s.end);
  }
  return { rewritten: out, mapping };
}
