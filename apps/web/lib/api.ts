import type {
  ClassifyResponse,
  HashtagCount,
  ModelChoice,
  Post,
  RecipientContext,
  ReplacementMode,
  RewriteResponse,
  Span,
  TopicCount,
  Visibility,
} from "./types";

function url(path: string): string {
  return path;
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async classify(text: string, model: ModelChoice): Promise<ClassifyResponse> {
    return jsonFetch("/api/classify", {
      method: "POST",
      body: JSON.stringify({ text, model }),
    });
  },
  async rewrite(args: {
    text: string;
    spans: Span[];
    excluded: number[];
    mode: ReplacementMode;
    recipient: RecipientContext;
    model: ModelChoice;
  }): Promise<RewriteResponse> {
    return jsonFetch("/api/rewrite", {
      method: "POST",
      body: JSON.stringify({
        text: args.text,
        spans: args.spans,
        excluded_indices: args.excluded,
        mode: args.mode,
        recipient: args.recipient,
        model: args.model,
      }),
    });
  },
  async extract(file: File): Promise<{ text: string; filename: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(url("/api/extract"), { method: "POST", body: fd });
    if (!res.ok) throw new Error(`extract failed: ${res.status}`);
    return res.json();
  },
  async listPosts(params: {
    topic?: string;
    hashtag?: string;
    status?: string;
    q?: string;
  }): Promise<Post[]> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const path = `/api/posts${qs.toString() ? `?${qs.toString()}` : ""}`;
    return jsonFetch(path);
  },
  async getPost(id: string): Promise<Post> {
    return jsonFetch(`/api/posts/${id}`);
  },
  async createPost(body: {
    title: string;
    body: string;
    topic: string;
    hashtags: string[];
    visibility: Visibility;
    author?: string;
  }): Promise<Post> {
    return jsonFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  async addComment(
    postId: string,
    body: string,
    author = "anonymous",
  ): Promise<Post> {
    return jsonFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, author }),
    });
  },
  async vote(postId: string, direction: "up" | "down"): Promise<Post> {
    return jsonFetch(`/api/posts/${postId}/vote?direction=${direction}`, {
      method: "POST",
    });
  },
  async voteComment(postId: string, commentId: string): Promise<Post> {
    return jsonFetch(
      `/api/posts/${postId}/comments/${commentId}/vote`,
      { method: "POST" },
    );
  },
  async accept(postId: string, commentId: string): Promise<Post> {
    return jsonFetch(`/api/posts/${postId}/accept/${commentId}`, {
      method: "POST",
    });
  },
  async topics(): Promise<TopicCount[]> {
    return jsonFetch("/api/topics");
  },
  async hashtags(): Promise<HashtagCount[]> {
    return jsonFetch("/api/hashtags");
  },
};
