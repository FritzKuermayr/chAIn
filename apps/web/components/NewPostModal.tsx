"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Post, Visibility } from "@/lib/types";
import { GatewayFlow } from "./GatewayFlow";
import { Modal } from "./Modal";

const TOPICS = [
  "Accounting",
  "Law",
  "Banking",
  "Public Sector",
  "Logistics",
  "Health",
  "Tech",
];

export function NewPostModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: Post) => void;
}) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [hashtags, setHashtags] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [busy, setBusy] = useState(false);

  async function publish(rewritten: string) {
    setBusy(true);
    try {
      const post = await api.createPost({
        title: title.trim() || "(untitled)",
        body: rewritten,
        topic,
        hashtags: hashtags
          .split(/[\s,]+/)
          .map((t) => t.replace(/^#/, "").trim().toLowerCase())
          .filter(Boolean),
        visibility,
        author: "you",
      });
      onCreated(post);
      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTitle("");
    setTopic(TOPICS[0]);
    setHashtags("");
    setVisibility("Public");
  }

  return (
    <Modal open={open} onClose={onClose} title="New post" width="xl">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Concrete, operational title"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
              Topic
            </span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            >
              {TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
              Hashtags
            </span>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="kyc aml trade-finance"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
              Visibility
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            >
              <option value="Public">Public</option>
              <option value="Restricted">Restricted</option>
            </select>
          </label>
        </div>

        <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
          Privacy gateway
        </div>

        <GatewayFlow
          showSendButton={false}
          approveLabel={busy ? "Publishing…" : "Approve & publish"}
          onApprove={(r) => publish(r.rewritten)}
          compact
        />
      </div>
    </Modal>
  );
}
