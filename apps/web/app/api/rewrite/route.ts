import type { ModelChoice, RecipientContext, ReplacementMode, Span } from "@/lib/types";
import { rewrite } from "@/lib/server/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    spans?: Span[];
    excluded_indices?: number[];
    mode?: ReplacementMode;
    recipient?: RecipientContext;
    model?: ModelChoice;
  };
  const text = body.text ?? "";
  const spans = Array.isArray(body.spans) ? body.spans : [];
  const excluded = new Set(body.excluded_indices ?? []);
  const keep = spans.filter((_, i) => !excluded.has(i));
  const result = await rewrite(
    text,
    keep,
    body.mode ?? "placeholder",
    body.recipient ?? "Client",
    body.model ?? "openai",
  );
  return Response.json(result);
}
