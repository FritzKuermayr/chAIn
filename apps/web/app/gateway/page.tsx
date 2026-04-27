"use client";
import { useState } from "react";
import { GatewayFlow, GatewayResult } from "@/components/GatewayFlow";

export default function GatewayPage() {
  const [sent, setSent] = useState<GatewayResult | null>(null);

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
          <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Outbound payload (preview)
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
            {sent.rewritten}
          </pre>
        </section>
      )}
    </section>
  );
}
