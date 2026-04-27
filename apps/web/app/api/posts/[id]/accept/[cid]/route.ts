import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await params;
  const post = getStore().accept(id, cid);
  if (!post) return Response.json({ error: "post or comment not found" }, { status: 404 });
  return Response.json(post);
}
