import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { body?: string; author?: string };
  if (!body.body) return Response.json({ error: "body required" }, { status: 400 });
  const post = getStore().addComment(id, body.body, body.author ?? "anonymous");
  if (!post) return Response.json({ error: "post not found" }, { status: 404 });
  return Response.json(post);
}
