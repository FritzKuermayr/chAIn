import { getStore } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const dir = (url.searchParams.get("direction") ?? "up") === "down" ? "down" : "up";
  const post = getStore().vote(id, dir);
  if (!post) return Response.json({ error: "post not found" }, { status: 404 });
  return Response.json(post);
}
