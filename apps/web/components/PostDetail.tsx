"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Post } from "@/lib/types";
import { StatusPill } from "./PostCard";

export function PostDetail({
  post,
  onChange,
  onClose,
}: {
  post: Post;
  onChange: (p: Post) => void;
  onClose: () => void;
}) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const updated = await api.addComment(post.id, reply);
      onChange(updated);
      setReply("");
    } finally {
      setBusy(false);
    }
  }

  async function vote(dir: "up" | "down") {
    const updated = await api.vote(post.id, dir);
    onChange(updated);
  }

  async function voteComment(cid: string) {
    const updated = await api.voteComment(post.id, cid);
    onChange(updated);
  }

  async function accept(cid: string) {
    const updated = await api.accept(post.id, cid);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="rounded bg-[var(--line)]/50 px-1.5 py-0.5">{post.topic}</span>
        {post.visibility === "Restricted" && (
          <span className="rounded border px-1.5 py-0.5">Restricted</span>
        )}
        <StatusPill status={post.status} />
        <span>·</span>
        <span>{post.author}</span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">{post.title}</h2>

      <pre className="whitespace-pre-wrap rounded-lg border bg-[var(--background)] p-4 text-sm leading-6 [font-family:inherit]">
        {post.body}
      </pre>

      <div className="flex flex-wrap items-center gap-1">
        {post.hashtags.map((t) => (
          <span
            key={t}
            className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--muted)]"
          >
            #{t}
          </span>
        ))}
        <div className="flex-1" />
        <button onClick={() => vote("up")} className="rounded border px-2 py-1 text-xs">
          ▲ {post.upvotes}
        </button>
        <button onClick={() => vote("down")} className="rounded border px-2 py-1 text-xs">
          ▼ {post.downvotes}
        </button>
      </div>

      <div className="border-t pt-4">
        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
          {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
        </div>
        <ul className="mt-2 space-y-3">
          {post.comments.map((c) => (
            <li
              key={c.id}
              className={`rounded-lg border p-3 ${c.is_solution ? "border-emerald-400 bg-emerald-50" : "bg-white"}`}
            >
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>{c.author}</span>
                {c.is_solution && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-800">
                    Solution
                  </span>
                )}
                <span className="ml-auto">▲ {c.upvotes}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{c.body}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => voteComment(c.id)}
                  className="rounded border px-2 py-0.5 text-[11px]"
                >
                  Upvote
                </button>
                {!c.is_solution && (
                  <button
                    onClick={() => accept(c.id)}
                    className="rounded border px-2 py-0.5 text-[11px]"
                  >
                    Mark as solution
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-4">
        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
          Reply
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Replies are NOT routed through the gateway in this demo — keep them already-anonymized."
          className="mt-2 w-full rounded border p-2 text-sm leading-6"
          rows={4}
        />
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1 text-sm">
            Close
          </button>
          <button
            onClick={send}
            disabled={busy || !reply.trim()}
            className="rounded bg-[var(--accent)] px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Posting…" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
