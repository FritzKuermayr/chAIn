import type { Category, MappingEntry, ModelChoice, ReplacementMode, Severity, Span } from "../types";
import { findSpans, localRewrite } from "./heuristics";

const CLASSIFY_SYSTEM = `You are the privacy classifier of the chAIn privacy gateway.

Your job: scan arbitrary user-supplied text and return EVERY span that contains private, sensitive, or security-critical data. Be exhaustive. A long business email or contract typically yields 20–60 spans. If you find fewer than 10 spans on a multi-paragraph document containing names, companies, addresses, IBANs, or tax IDs, you are under-flagging — re-scan.

This is NOT a "should we redact this email" decision. The wrapper (email / chat / note) is irrelevant. The embedded private items are what you flag.

SEVERITY (4 levels — never emit SAFE)
- REVIEW    — context-dependent or low-risk identifying data; surface for human decision
- SENSITIVE — private personal data; should usually be redacted
- CRITICAL  — secrets, credentials, payment credentials, government IDs, exact location, highly sensitive health data; redact aggressively

CATEGORY → SUBCATEGORY (always pick the most specific subcategory)
identity:
  name              — first / last / full legal / middle / maiden / unique alias
  official_identifier — passport, national ID, SSN, tax ID (USt-ID, DE…, NL BTW, etc.), driver license, student / employee / patient ID, register IDs (HRB, KVK, AG) when tied to a real entity
  birth_identity    — date of birth, place of birth, identity-relevant nationality
contact_location:
  contact           — personal email, phone, mobile, mailing address, emergency contact
  precise_location  — full address, apartment, GPS, live location, real-time whereabouts, person-linked travel itinerary
  routine_location  — workplace, school, frequent routines, commute pattern
financial:
  payment_credential — credit / debit card, CVV, expiry, bank account number, IBAN, routing number
  financial_profile  — income, salary, net worth, debt, loan details, tax filings, investment accounts
  transaction_record — bank statements, purchase history, person-linked invoices, payment confirmations
auth_secret:
  login_credential       — password, PIN, recovery / MFA backup code, security question answer
  api_secret             — API key, access / refresh / session token, OAuth secret, JWT secret, SSH / TLS private key, service account key, DB credential
  infrastructure_secret  — admin / root / VPN credential, encryption key, KMS secret, secret env var
health:
  medical          — diagnosis, treatment, prescription, lab result, doctor note, mental health record, ICD codes
  health_adjacent  — disability, sick leave, fertility, cycle, sleep, heart-rate, person-linked fitness data
  biometric_genetic — fingerprint, face / iris / voice scan, DNA, genetic test result
sensitive_trait:
  protected_trait      — religion, political affiliation, sexual orientation, sex life, union, ethnicity, sensitive immigration status
  sensitive_situation  — abuse, addiction, criminal record / accusation, family conflict, legal dispute, protected status
private_record:
  employment   — salary, performance review, HR complaint, disciplinary record, employment contract, background check
  education    — grade, transcript, exam result, admission decision
  legal_admin  — court / case / claim / file references, immigration document, tax notice, insurance, housing contract, internal memo references (e.g. BIT-HR-xxx, MZ-2026-xxx), license / badge numbers, professional indemnity numbers
household:
  family_relationship — family member name, child name, relationship status, dependency
  household_data      — household members, shared address, schedule, living arrangement, minors
  interpersonal       — private dispute, romantic conversation, family medical history tied to identifiable people
digital_identifier:
  online_identifier   — IP, device ID, cookie ID, ad ID, MAC, IMEI / IMSI, account / user ID
  account_identifier  — username / handle, profile URL, internal customer / employee system ID
behavioral:
  sensitive_activity  — login / access / location / browsing / search / purchase / calendar history
inferred:
  profile_inference     — risk score, fraud score, health prediction, personality / political-leaning profile, vulnerability classification
  behavioral_inference  — likely depressed / pregnant / undocumented / churning / high spender
other — only when none of the above fits

WHAT TO FLAG (non-exhaustive checklist for sweeping a document)
- Every personal name in body and signature: sender, recipient, cc'd third parties, named clients, lawyers, doctors, advisors, family members, employees
- Every email address, phone number, mobile number, fax — even if appearing inside parentheses or signatures
- Every street address, full postal code+city, named location
- Every tax ID, VAT number, national ID, SSN, professional ID
- Every IBAN, account number, credit card, routing number, payment reference
- Every register number (HRB, KVK, BTW, DCBA, AG, file ref) when it identifies a real entity
- Every case / claim / invoice / contract / loan / file reference
- Every date of birth (DOB / *) and age-with-name combinations
- Every diagnosis, medication, lab value, patient ID, ICD code
- Every credential, secret, token, key, password
- Every internal memo / file ref (e.g. BIT-HR-xxx, MZ-2026-xxxx, FA-MA-N-VBA-xxxx)
- Every license / badge / insurance policy number

OUTPUT — valid JSON, no fences, no commentary:
{"spans":[{"text":"exact substring","category":"<category>","subcategory":"<subcategory_id>","severity":"REVIEW|SENSITIVE|CRITICAL","recommended_action":"allow|allow_with_redaction|warn|block|manual_review","confidence":0.0,"note":"short why"}]}

RULES
- Do NOT include offsets — chAIn computes them.
- "text" must match the input exactly.
- Be exhaustive. Re-scan before answering. If fewer than 10 spans on a long document with names + companies + addresses, you missed items.
- If nothing is flaggable, return {"spans":[]}.`;

function rewriteSystem(mode: ReplacementMode, recipient: string): string {
  return `You are the rewriter of the chAIn privacy gateway.
You rewrite messages so that the operational meaning is fully preserved but private information is removed. Recipient context: ${recipient}.

Replacement mode: ${mode}
- placeholder: replace each private value with a generalized natural-language reference such as "Company A", "Bank Account", "Date of Birth", "Patient A", "API key". Stay generic.
- dummy: replace each private value with an obviously-fake but well-formed dummy, e.g. "ACME GmbH", "DE00 0000 0000 0000 0000 00", "1990-01-01", "patient42@example.com".

Constraints:
- Do not omit any operational detail (amounts, dates, regulations cited, technical errors, regulatory deadlines, legal references, clinical reasoning, technical reasoning).
- Keep tone neutral and professional.
- Use the SAME replacement for the SAME original throughout the message.
- The flagged spans you receive may carry CRITICAL, SENSITIVE, or REVIEW severity. Replace all of them. The user has already excluded any items they want to keep.

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

function normalizeCategory(raw: unknown): Category {
  const valid: Category[] = [
    "identity",
    "contact_location",
    "financial",
    "auth_secret",
    "health",
    "sensitive_trait",
    "private_record",
    "household",
    "digital_identifier",
    "behavioral",
    "inferred",
    "communication_content",
    "other",
  ];
  const s = typeof raw === "string" ? raw.toLowerCase().replace(/[\s-]/g, "_") : "";
  return (valid.find((v) => v === s) ?? "other") as Category;
}

function normalizeSeverity(raw: unknown): Severity {
  const s = typeof raw === "string" ? raw.toUpperCase() : "";
  if (s === "SAFE" || s === "REVIEW" || s === "SENSITIVE" || s === "CRITICAL") {
    return s;
  }
  return "SENSITIVE";
}

function highestSeverity(spans: Span[]): Severity {
  if (!spans.length) return "SAFE";
  const rank = { SAFE: 0, REVIEW: 1, SENSITIVE: 2, CRITICAL: 3 } as const;
  let best: Severity = "SAFE";
  for (const s of spans) {
    if (rank[s.severity] > rank[best]) best = s.severity;
  }
  return best;
}

function attachOffsets(
  text: string,
  items: {
    text?: string;
    category?: string;
    subcategory?: string;
    severity?: string;
    recommended_action?: string;
    confidence?: number;
    note?: string;
  }[],
): Span[] {
  const spans: Span[] = [];
  const used = new Set<string>();
  for (const it of items) {
    const needle = (it.text ?? "").trim();
    if (!needle) continue;
    const cat = normalizeCategory(it.category);
    const sev = normalizeSeverity(it.severity);
    if (sev === "SAFE") continue; // SAFE means: do not flag
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
          subcategory: it.subcategory ?? null,
          severity: sev,
          recommended_action:
            (it.recommended_action as Span["recommended_action"]) ?? null,
          confidence: typeof it.confidence === "number" ? it.confidence : null,
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

export async function classify(
  text: string,
  model: ModelChoice,
): Promise<{ spans: Span[]; overall: Severity }> {
  const provider = pickProvider(model);
  if (!provider) {
    const spans = findSpans(text);
    return { spans, overall: highestSeverity(spans) };
  }
  try {
    const raw = await chat(provider, CLASSIFY_SYSTEM, text, 8192);
    const data = extractJson(raw);
    const items = Array.isArray((data as { spans?: unknown[] }).spans)
      ? ((data as {
          spans: {
            text?: string;
            category?: string;
            subcategory?: string;
            severity?: string;
            recommended_action?: string;
            confidence?: number;
            note?: string;
          }[];
        }).spans)
      : [];
    const spans = attachOffsets(text, items);
    return { spans, overall: highestSeverity(spans) };
  } catch (e) {
    console.error("[chAIn] classify failed, falling back to regex:", e);
    const spans = findSpans(text);
    return { spans, overall: highestSeverity(spans) };
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
      ? spans
          .map(
            (s) =>
              `- [${s.severity}] [${s.category}${s.subcategory ? "/" + s.subcategory : ""}] ${s.text}`,
          )
          .join("\n")
      : "(model decides)";
    const user = `Recipient: ${recipient}\nReplacement mode: ${mode}\n\nSpans flagged for replacement:\n${targetList}\n\nOriginal text:\n---\n${text}\n---`;
    const raw = await chat(provider, rewriteSystem(mode, recipient), user, 4096);
    const data = extractJson(raw);
    const rewritten = (data as { rewritten?: string }).rewritten ?? "";
    const rawMap = Array.isArray((data as { mapping?: unknown[] }).mapping)
      ? ((data as {
          mapping: { original?: string; replacement?: string; category?: string }[];
        }).mapping)
      : [];
    const mapping: MappingEntry[] = rawMap
      .filter((m) => m.original && m.replacement)
      .map((m) => ({
        original: m.original!,
        replacement: m.replacement!,
        category: normalizeCategory(m.category),
      }));
    if (!rewritten) return localRewrite(text, spans, mode);
    return { rewritten, mapping };
  } catch (e) {
    console.error("[chAIn] rewrite failed, falling back to local:", e);
    return localRewrite(text, spans, mode);
  }
}
