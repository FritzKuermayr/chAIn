"use client";
import { Post } from "@/lib/types";

export function PostCard({
  post,
  onClick,
  onVote,
}: {
  post: Post;
  onClick: () => void;
  onVote: (dir: "up" | "down") => void;
}) {
  return (
    <article className="flex gap-4 rounded-xl border bg-white p-4 hover:border-[var(--accent)]">
      <div className="flex flex-col items-center gap-1 text-xs text-[var(--muted)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote("up");
          }}
          className="rounded px-1 hover:bg-[var(--line)]/40"
          aria-label="upvote"
        >
          ▲
        </button>
        <span className="tabular-nums">{post.upvotes - post.downvotes}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote("down");
          }}
          className="rounded px-1 hover:bg-[var(--line)]/40"
          aria-label="downvote"
        >
          ▼
        </button>
      </div>
      <button
        onClick={onClick}
        className="flex-1 cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span className="rounded bg-[var(--line)]/50 px-1.5 py-0.5">{post.topic}</span>
          {post.visibility === "Restricted" && (
            <span className="rounded border px-1.5 py-0.5">Restricted</span>
          )}
          <StatusPill status={post.status} />
          <span>·</span>
          <span>{post.author}</span>
          <span>·</span>
          <span>{post.comments.length} replies</span>
        </div>
        <h3 className="mt-1 text-base font-medium tracking-tight">{post.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
          {post.body.split("\n")[0]}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {post.hashtags.map((t) => (
            <span
              key={t}
              className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--muted)]"
            >
              #{t}
            </span>
          ))}
        </div>
      </button>
    </article>
  );
}

export function StatusPill({ status }: { status: "Open" | "Solved" }) {
  const cls =
    status === "Solved"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}
