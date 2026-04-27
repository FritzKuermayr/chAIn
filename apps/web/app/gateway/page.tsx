"use client";
import { useState } from "react";
import { GatewayFlow, GatewayResult } from "@/components/GatewayFlow";
import { EmailComposeModal } from "@/components/EmailComposeModal";
import { OutboundChannels } from "@/components/OutboundChannels";

export default function GatewayPage() {
  const [sent, setSent] = useState<GatewayResult | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              Outbound payload
            </div>
            <button
              onClick={() => setEmailOpen(true)}
              className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white"
            >
              Send via email
            </button>
          </div>

          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
            {sent.rewritten}
          </pre>

          <div className="mt-4 border-t pt-3">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Or send to
            </div>
            <OutboundChannels text={sent.rewritten} />
          </div>
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
