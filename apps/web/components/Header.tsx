import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Logo />
          <span>
            ch<span className="text-[var(--critical)]">AI</span>n
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/gateway" label="Privacy Gateway" />
          <NavLink href="/network" label="Network" />
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--line)]/60 hover:text-[var(--foreground)]"
    >
      {label}
    </Link>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8a4 4 0 0 1 4-4h2a4 4 0 0 1 0 8h-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 16a4 4 0 0 1-4 4h-2a4 4 0 0 1 0-8h1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
