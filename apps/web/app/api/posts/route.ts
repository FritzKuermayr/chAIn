import { getStore } from "@/lib/server/store";
import type { Visibility } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const posts = getStore().list({
    topic: url.searchParams.get("topic") ?? undefined,
    hashtag: url.searchParams.get("hashtag") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    query: url.searchParams.get("q") ?? undefined,
  });
  return Response.json(posts);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    topic?: string;
    hashtags?: string[];
    visibility?: Visibility;
    author?: string;
  };
  if (!body.title || !body.body || !body.topic) {
    return Response.json({ error: "title, body, topic required" }, { status: 400 });
  }
  const post = getStore().create({
    title: body.title,
    body: body.body,
    topic: body.topic,
    hashtags: body.hashtags ?? [],
    visibility: body.visibility ?? "Public",
    author: body.author ?? "anonymous",
  });
  return Response.json(post);
}
