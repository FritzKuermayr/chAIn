"use client";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";

export function EmailComposeModal({
  open,
  onClose,
  initialBody,
  initialSubject = "chAIn — anonymized message",
}: {
  open: boolean;
  onClose: () => void;
  initialBody: string;
  initialSubject?: string;
}) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (open) {
      setBody(initialBody);
      setSubject(initialSubject);
    }
  }, [open, initialBody, initialSubject]);

  const valid = /\S+@\S+\.\S+/.test(to.trim());

  function openInMailClient() {
    const params: string[] = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (cc.trim()) params.push(`cc=${encodeURIComponent(cc.trim())}`);
    const url = `mailto:${encodeURIComponent(to.trim())}${params.length ? `?${params.join("&")}` : ""}`;
    window.location.href = url;
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Send via email" width="md">
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
            To
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            type="email"
            autoFocus
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
            Cc <span className="normal-case text-[10px] tracking-normal">(optional)</span>
          </span>
          <input
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="colleague@example.com"
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
            Subject
          </span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest text-[var(--muted)]">
            Body <span className="normal-case text-[10px] tracking-normal">(anonymized — edit if needed)</span>
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={Math.min(14, Math.max(6, body.split("\n").length + 1))}
            className="mt-1 w-full rounded border p-2 leading-6"
          />
        </label>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-[var(--muted)]">
            Opens your mail client (Apple Mail / Outlook / Gmail).
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded border px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={openInMailClient}
              disabled={!valid}
              className="rounded bg-[var(--accent)] px-4 py-1.5 text-white disabled:opacity-50"
              title={valid ? "" : "Enter a valid recipient address"}
            >
              Open in mail app
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
