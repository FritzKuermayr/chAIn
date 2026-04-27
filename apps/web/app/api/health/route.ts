export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    openai_configured: !!process.env.OPENAI_API_KEY,
    tinker_configured: !!process.env.TINKER_API_KEY,
    openai_model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    tinker_model: process.env.TINKER_MODEL ?? "moonshotai/Kimi-K2-Instruct",
    version: "0.2.0",
  });
}
