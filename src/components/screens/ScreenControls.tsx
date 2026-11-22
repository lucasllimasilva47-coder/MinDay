import type { ReactNode } from "react";

export const Colon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 16 24" aria-hidden="true">
    <circle cx="8" cy="7" r="2.5" fill="currentColor" />
    <circle cx="8" cy="17" r="2.5" fill="currentColor" />
  </svg>
);

export function Chip({
  active,
  activeClass = "bg-sky-500",
  onClick,
  children,
}: {
  active: boolean;
  activeClass?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 ${
        active ? activeClass : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}
