"use client";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const w =
    width === "sm"
      ? "max-w-md"
      : width === "md"
        ? "max-w-xl"
        : width === "xl"
          ? "max-w-5xl"
          : "max-w-3xl";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-6 backdrop-blur-sm">
      <div className={`w-full ${w} rounded-xl border bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="text-sm font-medium">{title}</div>
          <button onClick={onClose} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--line)]/40">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
