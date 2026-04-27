"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { HashtagCount, Post, TopicCount } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { Modal } from "@/components/Modal";
import { PostDetail } from "@/components/PostDetail";
import { NewPostModal } from "@/components/NewPostModal";
import { ApiAccessModal } from "@/components/ApiAccessModal";

type Filter = "All" | "Open" | "Solved";

export default function NetworkPage() {
  const [topics, setTopics] = useState<TopicCount[]>([]);
  const [hashtags, setHashtags] = useState<HashtagCount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Post | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showApi, setShowApi] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [t, h, p] = await Promise.all([
        api.topics(),
        api.hashtags(),
        api.listPosts({
          topic: activeTopic ?? undefined,
          hashtag: activeTag ?? undefined,
          status: filter === "All" ? undefined : filter,
          q: q || undefined,
        }),
      ]);
      setTopics(t);
      setHashtags(h);
      setPosts(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [activeTopic, activeTag, filter]);

  function toggleFollow(key: string) {
    setFollowing((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  const headerLabel = useMemo(() => {
    if (activeTopic) return activeTopic;
    if (activeTag) return `#${activeTag}`;
    return "Feed";
  }, [activeTopic, activeTag]);

  return (
    <section className="grid gap-6 pt-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6 text-sm">
        <div>
          <button
            onClick={() => setShowNew(true)}
            className="w-full rounded bg-[var(--accent)] px-3 py-2 text-sm text-white"
          >
            + Add post
          </button>
          <button
            onClick={() => setShowApi(true)}
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
          >
            Connect via API
          </button>
        </div>

        <div>
          <SidebarHeading>Topics</SidebarHeading>
          <ul>
            <SidebarItem
              active={!activeTopic && !activeTag}
              onClick={() => {
                setActiveTopic(null);
                setActiveTag(null);
              }}
              label="All topics"
            />
            {topics.map((t) => (
              <SidebarItem
                key={t.name}
                active={activeTopic === t.name}
                onClick={() => {
                  setActiveTopic(t.name === activeTopic ? null : t.name);
                  setActiveTag(null);
                }}
                label={t.name}
                count={t.count}
                followed={following.has(`topic:${t.name}`)}
                onFollow={() => toggleFollow(`topic:${t.name}`)}
              />
            ))}
          </ul>
        </div>

        <div>
          <SidebarHeading>Hashtags</SidebarHeading>
          <ul>
            {hashtags.slice(0, 12).map((t) => (
              <SidebarItem
                key={t.name}
                active={activeTag === t.name}
                onClick={() => {
                  setActiveTag(t.name === activeTag ? null : t.name);
                  setActiveTopic(null);
                }}
                label={`#${t.name}`}
                count={t.count}
                followed={following.has(`tag:${t.name}`)}
                onFollow={() => toggleFollow(`tag:${t.name}`)}
              />
            ))}
          </ul>
        </div>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{headerLabel}</h2>
          <div className="flex-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") refresh();
            }}
            placeholder="Search title, body, topic, hashtag…"
            className="w-72 rounded border px-3 py-1.5 text-sm"
          />
          <div className="flex rounded border text-sm">
            {(["All", "Open", "Solved"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 ${filter === f ? "bg-[var(--accent)] text-white" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="text-sm text-[var(--muted)]">Loading…</div>}
        {!loading && posts.length === 0 && (
          <div className="rounded border bg-white p-8 text-center text-sm text-[var(--muted)]">
            No posts match this filter.
          </div>
        )}

        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onClick={() => setOpen(p)}
              onVote={async (dir) => {
                const updated = await api.vote(p.id, dir);
                setPosts((prev) =>
                  prev.map((x) => (x.id === updated.id ? updated : x)),
                );
              }}
            />
          ))}
        </div>
      </div>

      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
        width="lg"
      >
        {open && (
          <PostDetail
            post={open}
            onChange={(updated) => {
              setOpen(updated);
              setPosts((prev) =>
                prev.map((x) => (x.id === updated.id ? updated : x)),
              );
            }}
            onClose={() => setOpen(null)}
          />
        )}
      </Modal>

      <NewPostModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(p) => {
          setPosts((prev) => [p, ...prev]);
        }}
      />
      <ApiAccessModal open={showApi} onClose={() => setShowApi(false)} />
    </section>
  );
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[11px] uppercase tracking-widest text-[var(--muted)]">
      {children}
    </div>
  );
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  followed,
  onFollow,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  followed?: boolean;
  onFollow?: () => void;
}) {
  return (
    <li>
      <div
        className={`flex items-center gap-2 rounded px-2 py-1 ${active ? "bg-[var(--line)]/60" : "hover:bg-[var(--line)]/40"}`}
      >
        <button onClick={onClick} className="flex-1 text-left">
          {label}
        </button>
        {typeof count === "number" && (
          <span className="text-[11px] text-[var(--muted)]">{count}</span>
        )}
        {onFollow && (
          <button
            onClick={onFollow}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${followed ? "border-[var(--accent)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
          >
            {followed ? "Following" : "Follow"}
          </button>
        )}
      </div>
    </li>
  );
}
