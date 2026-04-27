import type { Category, MappingEntry, ModelChoice, ReplacementMode, Span } from "../types";
import { findSpans, localRewrite } from "./heuristics";

const CLASSIFY_SYSTEM = `You are a privacy classifier for the chAIn privacy gateway.
You receive arbitrary business text and must return every span that contains critical private information. Use these categories:
- name: personal names of individuals
- address: street addresses, postcodes, building numbers
- tax_id: tax identifiers, VAT numbers, SSN-like numbers
- account: IBAN, account numbers, credit cards
- password: passwords, secrets in cleartext
- api_key: tokens, bearer tokens, API keys
- medical: diagnoses, medications, patient identifiers, clinical details
- identifier: case numbers, claim IDs, invoice numbers, ticket IDs that identify a real entity
- contact: email addresses and phone numbers
- other: anything else identifying or operationally sensitive

Return ONLY valid JSON of the form:
{"spans": [{"text": "...", "category": "...", "note": "short why"}]}
Do NOT include offsets — chAIn computes them from text matching.
Keep \`text\` exactly as it appears in the input.
If no critical info is present, return {"spans": []}.`;

function rewriteSystem(mode: ReplacementMode, recipient: string): string {
  return `You are the rewriter of the chAIn privacy gateway.
You rewrite messages so that the operational meaning is fully preserved but private information is removed. Recipient context: ${recipient}.

Replacement mode: ${mode}
- placeholder: replace each private value with a generalized natural-language reference such as "Company A", "Bank Account", "Date of Birth", "Patient A", "API key". Stay generic.
- dummy: replace each private value with an obviously-fake but well-formed dummy, e.g. "ACME GmbH", "DE00 0000 0000 0000 0000 00", "1990-01-01", "patient42@example.com".

Constraints:
- Do not omit any operational detail (amounts, dates, regulations cited, technical errors, regulatory deadlines).
- Keep tone neutral and professional.
- Use the SAME replacement for the SAME original throughout the message.

Return ONLY valid JSON:
{"rewritten": "...", "mapping": [{"original": "...", "replacement": "...", "category": "..."}]}`;
}

type ChatProvider = {
  baseUrl: string;
  apiKey: string;
  model: string;
  label: "openai" | "kimi";
};

function openaiProvider(): ChatProvider | null {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    label: "openai",
  };
}

function tinkerProvider(): ChatProvider | null {
  const apiKey = process.env.TINKER_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    baseUrl:
      process.env.TINKER_BASE_URL ??
      "https://tinker.thinkingmachines.dev/services/tinker-prod/oai/api/v1",
    apiKey,
    model: process.env.TINKER_MODEL ?? "moonshotai/Kimi-K2-Instruct",
    label: "kimi",
  };
}

function pickProvider(model: ModelChoice): ChatProvider | null {
  if (model === "kimi") return tinkerProvider();
  return openaiProvider();
}

async function chat(
  provider: ChatProvider,
  system: string,
  user: string,
  maxTokens = 2048,
): Promise<string> {
  const url = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${provider.label} chat ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(raw: string): Record<string, unknown> {
  let s = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(s);
  if (fence) s = fence[1];
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return {};
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return {};
  }
}

function attachOffsets(text: string, items: { text?: string; category?: string; note?: string }[]): Span[] {
  const spans: Span[] = [];
  const used = new Set<string>();
  for (const it of items) {
    const needle = (it.text ?? "").trim();
    if (!needle) continue;
    const cat = (it.category ?? "other") as Category;
    let idx = 0;
    while (true) {
      const i = text.indexOf(needle, idx);
      if (i === -1) break;
      const key = `${i}:${i + needle.length}`;
      if (!used.has(key)) {
        used.add(key);
        spans.push({
          start: i,
          end: i + needle.length,
          text: needle,
          category: cat,
          severity: "CRITICAL",
          note: it.note ?? null,
        });
        break;
      }
      idx = i + 1;
    }
  }
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

export async function classify(text: string, model: ModelChoice): Promise<Span[]> {
  const provider = pickProvider(model);
  if (!provider) return findSpans(text);
  try {
    const raw = await chat(provider, CLASSIFY_SYSTEM, text, 2048);
    const data = extractJson(raw);
    const items = Array.isArray((data as { spans?: unknown[] }).spans)
      ? ((data as { spans: { text?: string; category?: string; note?: string }[] }).spans)
      : [];
    return attachOffsets(text, items);
  } catch (e) {
    console.error("[chAIn] classify failed, falling back to regex:", e);
    return findSpans(text);
  }
}

export async function rewrite(
  text: string,
  spans: Span[],
  mode: ReplacementMode,
  recipient: string,
  model: ModelChoice,
): Promise<{ rewritten: string; mapping: MappingEntry[] }> {
  const provider = pickProvider(model);
  if (!provider) return localRewrite(text, spans, mode);
  try {
    const targetList = spans.length
      ? spans.map((s) => `- [${s.category}] ${s.text}`).join("\n")
      : "(model decides)";
    const user = `Recipient: ${recipient}\nReplacement mode: ${mode}\n\nSpans flagged for replacement:\n${targetList}\n\nOriginal text:\n---\n${text}\n---`;
    const raw = await chat(provider, rewriteSystem(mode, recipient), user, 4096);
    const data = extractJson(raw);
    const rewritten = (data as { rewritten?: string }).rewritten ?? "";
    const rawMap = Array.isArray((data as { mapping?: unknown[] }).mapping)
      ? ((data as { mapping: { original?: string; replacement?: string; category?: string }[] }).mapping)
      : [];
    const mapping: MappingEntry[] = rawMap
      .filter((m) => m.original && m.replacement)
      .map((m) => ({
        original: m.original!,
        replacement: m.replacement!,
        category: (m.category ?? "other") as Category,
      }));
    if (!rewritten) return localRewrite(text, spans, mode);
    return { rewritten, mapping };
  } catch (e) {
    console.error("[chAIn] rewrite failed, falling back to local:", e);
    return localRewrite(text, spans, mode);
  }
}
