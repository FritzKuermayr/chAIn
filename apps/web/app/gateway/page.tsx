"use client";
import { useState } from "react";
import { GatewayFlow, GatewayResult } from "@/components/GatewayFlow";
import { EmailComposeModal } from "@/components/EmailComposeModal";

export default function GatewayPage() {
  const [sent, setSent] = useState<GatewayResult | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!sent) return;
    try {
      await navigator.clipboard.writeText(sent.rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Gateway</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        Paste, upload, or draft. Classify, rewrite, optionally review — then
        send.
      </p>

      <div className="mt-6">
        <GatewayFlow
          showSendButton
          onApprove={(r) => setSent(r)}
          approveLabel="Approve & send"
        />
      </div>

      {sent && (
        <section className="mt-8 rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              Outbound payload
            </div>
            <div className="flex gap-2">
              <button
                onClick={copy}
                className="rounded border px-3 py-1 text-xs hover:bg-[var(--line)]/40"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setEmailOpen(true)}
                className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white"
              >
                Send via email
              </button>
            </div>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
            {sent.rewritten}
          </pre>
        </section>
      )}

      <EmailComposeModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        initialBody={sent?.rewritten ?? ""}
      />
    </section>
  );
}
