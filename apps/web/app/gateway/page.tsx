"use client";
import { useState } from "react";
import { GatewayFlow, GatewayResult } from "@/components/GatewayFlow";
import { OutboundChannels } from "@/components/OutboundChannels";

export default function GatewayPage() {
  const [sent, setSent] = useState<GatewayResult | null>(null);

  return (
    <section className="pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Gateway</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        Paste, upload, or draft. chAIn classifies and rewrites automatically as
        you go — review, then send.
      </p>

      <div className="mt-6">
        <GatewayFlow onApprove={(r) => setSent(r)} approveLabel="Approve" />
      </div>

      {sent && (
        <section className="mt-8 rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              Outbound payload
            </div>
            <OutboundChannels text={sent.rewritten} />
          </div>

          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 [font-family:inherit]">
            {sent.rewritten}
          </pre>
        </section>
      )}
    </section>
  );
}
