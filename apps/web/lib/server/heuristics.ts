import type { Category, Severity, Span } from "../types";

type Pattern = {
  category: Category;
  subcategory: string;
  severity: Severity;
  pattern: RegExp;
};

const PATTERNS: Pattern[] = [
  // auth_secret
  { category: "auth_secret", subcategory: "api_secret", severity: "CRITICAL",
    pattern: /sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,}|xox[bp]-[A-Za-z0-9-]{10,}|tml-[A-Za-z0-9_-]{16,}/g },
  { category: "auth_secret", subcategory: "api_secret", severity: "CRITICAL",
    pattern: /\b[A-Fa-f0-9]{32,64}\b/g },
  { category: "auth_secret", subcategory: "login_credential", severity: "CRITICAL",
    pattern: /password\s*[:=]\s*\S+/gi },

  // identity / official_identifier
  { category: "identity", subcategory: "official_identifier", severity: "CRITICAL",
    pattern: /\bDE\d{9}\b|\bATU\d{8}\b|\b\d{3}-\d{2}-\d{4}\b/g },

  // financial / payment_credential
  { category: "financial", subcategory: "payment_credential", severity: "CRITICAL",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g },
  { category: "financial", subcategory: "payment_credential", severity: "CRITICAL",
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },

  // contact_location
  { category: "contact_location", subcategory: "contact", severity: "SENSITIVE",
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { category: "contact_location", subcategory: "contact", severity: "SENSITIVE",
    pattern: /\+?\d[\d\s\-().]{7,}\d/g },
  { category: "contact_location", subcategory: "precise_location", severity: "SENSITIVE",
    pattern: /\b\d{1,4}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(?:Street|St|Road|Rd|Avenue|Ave|Stra(ß|ss)e|Str\.)\b/g },
  { category: "contact_location", subcategory: "precise_location", severity: "REVIEW",
    pattern: /\b\d{4,5}\s+[A-ZÄÖÜ][a-zäöüß]+\b/g },

  // private_record / legal_admin (case / claim / invoice IDs)
  { category: "private_record", subcategory: "legal_admin", severity: "REVIEW",
    pattern: /\b(?:invoice|case|claim|ticket)\s*#?\s*[A-Z0-9-]{3,}\b/gi },

  // health
  { category: "health", subcategory: "medical", severity: "SENSITIVE",
    pattern: /\b(ICD-?10|diagnosis|prescription|patient ID)\b[^\n.]{0,40}/gi },

  // identity / name
  { category: "identity", subcategory: "name", severity: "SENSITIVE",
    pattern: /\b(?:Mr|Mrs|Ms|Dr|Herr|Frau)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g },
];

export function findSpans(text: string): Span[] {
  const raw: Span[] = [];
  for (const { category, subcategory, severity, pattern } of PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      raw.push({
        start,
        end,
        text: m[0],
        category,
        subcategory,
        severity,
        recommended_action:
          severity === "CRITICAL"
            ? "block"
            : severity === "SENSITIVE"
              ? "allow_with_redaction"
              : "manual_review",
        confidence: 0.7,
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
    identity: "Person",
    contact_location: "Contact",
    financial: "Bank Account",
    auth_secret: "Credential",
    health: "Medical Detail",
    sensitive_trait: "Trait",
    private_record: "Reference",
    household: "Household Member",
    digital_identifier: "Identifier",
    behavioral: "Activity",
    inferred: "Inferred Attribute",
    communication_content: "Communication",
    other: "Detail",
  };
  return `${base[category] ?? "Detail"} ${String.fromCharCode(65 + (idx % 26))}`;
}

export function localDummy(category: Category, idx: number): string {
  const fakes: Record<Category, string[]> = {
    identity: ["John Doe", "Jane Roe", "Sam Quinn"],
    contact_location: ["user@example.com", "1 Example Street, 00000 Sample City"],
    financial: ["DE00 0000 0000 0000 0000 00", "0000 0000 0000 0000"],
    auth_secret: ["sk-test-dummy-0000000000000000", "•••••••••"],
    health: ["unspecified clinical condition"],
    sensitive_trait: ["[redacted trait]"],
    private_record: [`REF-${1000 + idx}`],
    household: ["Family Member A"],
    digital_identifier: ["user-0000"],
    behavioral: ["[redacted activity]"],
    inferred: ["[redacted inference]"],
    communication_content: ["[redacted]"],
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
