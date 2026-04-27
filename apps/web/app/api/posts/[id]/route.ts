import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getStore().get(id);
  if (!post) return Response.json({ error: "post not found" }, { status: 404 });
  return Response.json(post);
}
