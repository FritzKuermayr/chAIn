import fs from "node:fs";
import path from "node:path";
import type { Comment, Post } from "../types";

type GlobalWithStore = typeof globalThis & {
  __chainStore?: Store;
};

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function randHex(): string {
  return Math.random().toString(16).slice(2, 12);
}

class Store {
  private posts: Map<string, Post> = new Map();

  constructor() {
    this.loadSeed();
  }

  private loadSeed() {
    const candidates = [
      path.join(process.cwd(), "seed", "posts.json"),
      path.join(process.cwd(), "apps", "web", "seed", "posts.json"),
      path.resolve(__dirname, "..", "..", "seed", "posts.json"),
    ];
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as Post[];
          for (const post of raw) this.posts.set(post.id, post);
          return;
        }
      } catch {
        // try next
      }
    }
  }

  list(opts: { topic?: string; hashtag?: string; status?: string; query?: string }): Post[] {
    let items = [...this.posts.values()];
    if (opts.topic) {
      const t = opts.topic.toLowerCase();
      items = items.filter((p) => p.topic.toLowerCase() === t);
    }
    if (opts.hashtag) {
      const tag = opts.hashtag.replace(/^#/, "").toLowerCase();
      items = items.filter((p) =>
        p.hashtags.some((x) => x.replace(/^#/, "").toLowerCase() === tag),
      );
    }
    if (opts.status && opts.status.toLowerCase() !== "all") {
      const s = opts.status.toLowerCase();
      items = items.filter((p) => p.status.toLowerCase() === s);
    }
    if (opts.query) {
      const q = opts.query.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          p.hashtags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return items;
  }

  get(id: string): Post | undefined {
    return this.posts.get(id);
  }

  create(input: Omit<Post, "id" | "created_at" | "status" | "upvotes" | "downvotes" | "comments" | "accepted_solution_id">): Post {
    const post: Post = {
      ...input,
      id: newId("post"),
      created_at: nowIso(),
      status: "Open",
      upvotes: 0,
      downvotes: 0,
      comments: [],
      accepted_solution_id: null,
    };
    this.posts.set(post.id, post);
    return post;
  }

  addComment(postId: string, body: string, author: string): Post | undefined {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    const c: Comment = {
      id: `c_${randHex()}`,
      body,
      author,
      created_at: nowIso(),
      is_solution: false,
      upvotes: 0,
    };
    post.comments.push(c);
    return post;
  }

  vote(postId: string, dir: "up" | "down"): Post | undefined {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    if (dir === "up") post.upvotes++;
    else post.downvotes++;
    return post;
  }

  voteComment(postId: string, commentId: string): Post | undefined {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    const c = post.comments.find((x) => x.id === commentId);
    if (!c) return undefined;
    c.upvotes++;
    return post;
  }

  accept(postId: string, commentId: string): Post | undefined {
    const post = this.posts.get(postId);
    if (!post) return undefined;
    const c = post.comments.find((x) => x.id === commentId);
    if (!c) return undefined;
    for (const x of post.comments) x.is_solution = x.id === commentId;
    post.accepted_solution_id = commentId;
    post.status = "Solved";
    return post;
  }

  topics(): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const p of this.posts.values()) {
      counts[p.topic] = (counts[p.topic] ?? 0) + 1;
    }
    const canonical = ["Accounting", "Law", "Banking", "Public Sector", "Logistics", "Health", "Tech"];
    return canonical.map((name) => ({ name, count: counts[name] ?? 0 }));
  }

  hashtags(top = 30): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const p of this.posts.values()) {
      for (const t of p.hashtags) {
        const k = t.replace(/^#/, "").toLowerCase();
        counts[k] = (counts[k] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([name, count]) => ({ name, count }));
  }
}

export function getStore(): Store {
  const g = globalThis as GlobalWithStore;
  if (!g.__chainStore) g.__chainStore = new Store();
  return g.__chainStore;
}
