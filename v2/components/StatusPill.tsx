type Tone = "danger" | "warn" | "ok" | "brand" | "neutral";

const TONE: Record<Tone, string> = {
  danger: "bg-danger-soft text-danger-ink",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  brand: "bg-brand-soft text-brand-ink",
  neutral: "bg-canvas text-ink-soft",
};

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
