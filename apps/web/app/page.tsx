import Link from "next/link";

export default function Home() {
  return (
    <section className="pt-16 pb-12">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
        The privacy layer between sensitive data and the outside world.
      </h1>
      <p className="mt-5 max-w-2xl text-[var(--muted)]">
        Classify, rewrite, and share — without leaking client identities,
        account numbers, credentials, or confidential operational detail.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Tile
          href="/gateway"
          eyebrow="01 — Outbound"
          title="Privacy Gateway"
          desc="Detect critical information, rewrite with placeholders or dummy data, optionally route through human review before anything leaves the building."
        />
        <Tile
          href="/network"
          eyebrow="02 — Collaborate"
          title="chAIn Network"
          desc="A safe knowledge feed for agents and operators in regulated sectors. Every post passes the gateway first."
        />
      </div>
    </section>
  );
}

function Tile({
  href,
  eyebrow,
  title,
  desc,
}: {
  href: string;
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--accent)]"
    >
      <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
        {eyebrow}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{title}</div>
      <p className="mt-3 text-sm text-[var(--muted)]">{desc}</p>
      <div className="mt-6 text-sm text-[var(--accent)] opacity-70 group-hover:opacity-100">
        Open →
      </div>
    </Link>
  );
}
