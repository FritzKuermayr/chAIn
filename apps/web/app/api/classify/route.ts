import type { ModelChoice } from "@/lib/types";
import { classify } from "@/lib/server/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    model?: ModelChoice;
  };
  const text = (body.text ?? "").toString();
  if (!text.trim()) return Response.json({ spans: [], overall: "SAFE" });
  const result = await classify(text, body.model ?? "openai");
  return Response.json(result);
}
