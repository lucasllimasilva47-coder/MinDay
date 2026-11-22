import { useId } from "react";

export type MascotMood = "happy" | "cheer" | "sleepy" | "focus";

export function Mascot({ size = 88, mood = "happy" }: { size?: number; mood?: MascotMood }) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      className="drop-shadow-md"
      role="img"
      aria-label="Mascote do MinDay"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="100%" stopColor="#ffb703" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="56" fill={`url(#${gradientId})`} />
      <path d="M34 40c10-12 44-12 60 0-18 2-46 2-60 0z" fill="#8b4513" opacity=".9" />
      {mood === "sleepy" && (
        <>
          <path d="M39 66h14M75 66h14" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
          <path d="M56 90q8 5 16 0" stroke="#1f2937" strokeWidth="5" fill="none" strokeLinecap="round" />
          <text x="96" y="30" fontSize="20" fontWeight="700" fill="#93c5fd">z</text>
          <text x="108" y="16" fontSize="14" fontWeight="700" fill="#93c5fd">z</text>
        </>
      )}
      {mood === "cheer" && (
        <>
          <path d="M39 70q7-10 14 0M75 70q7-10 14 0" stroke="#1f2937" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M44 82c6 22 34 22 40 0z" fill="#1f2937" />
          <path d="M54 96c6 5 14 5 20 0c-4-4-16-4-20 0z" fill="#fb7185" />
          <path d="M16 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fde68a" />
          <path d="M108 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fde68a" />
        </>
      )}
      {(mood === "happy" || mood === "focus") && (
        <>
          <circle cx="46" cy="66" r="7" fill="#1f2937" />
          <circle cx="82" cy="66" r="7" fill="#1f2937" />
          {mood === "focus" && (
            <path d="M36 55l18 5M92 55l-18 5" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
          )}
          <path
            d={mood === "focus" ? "M54 90h20" : "M48 86c10 10 22 10 32 0"}
            stroke="#1f2937"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="34" cy="76" r="6" fill="#ffa69e" />
      <circle cx="94" cy="76" r="6" fill="#ffa69e" />
    </svg>
  );
}
