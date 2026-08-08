type OrnamentProps = {
  rule?: string;
  stretch?: boolean;
  className?: string;
};

export function Ornament({
  rule = "w-16",
  stretch = false,
  className = "",
}: OrnamentProps) {
  const line = stretch ? "flex-1" : rule;

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-2 ${stretch ? "w-full" : ""} ${className}`}
    >
      <span
        className={`${line} h-px bg-[linear-gradient(90deg,transparent,var(--gold)_65%,var(--gold))]`}
      />
      <span className="text-[11px] text-gold">◆</span>
      <span
        className={`${line} h-px bg-[linear-gradient(90deg,var(--gold),var(--gold)_35%,transparent)]`}
      />
    </div>
  );
}
