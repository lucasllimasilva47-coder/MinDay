import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import { Button } from "../ui";
import { Mascot } from "../Mascot";
import { brand } from "../brand";

export type TabKey = "home" | "agenda" | "pomodoro" | "sono" | "perfil";
export type NavTab = { key: TabKey; label: string; icon: LucideIcon };
export function Header({ current, onNavigate, tabs }: { current: TabKey; onNavigate: (k: TabKey) => void; tabs: readonly NavTab[] }) {
  const { t } = useLanguage();
  const { progress, streak } = useGame();

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 backdrop-blur-sm" style={{ background: "rgba(11,27,45,0.7)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Mascot size={40} />
          <div>
            <div className="text-lg font-extrabold tracking-wide sm:text-xl">{brand.name}</div>
            <div className="hidden text-xs text-white/70 sm:block">{t("tagline")}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-extrabold sm:mr-4 sm:gap-2 sm:text-sm">
          <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1" title="Dias seguidos estudando">🔥 {streak}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1" title="XP total">⭐ {progress.xp}</span>
        </div>
        <nav className="hidden shrink-0 gap-2 lg:flex" aria-label="Navegação principal">
          {tabs.map((t) => (
            <Button
              key={t.key}
              className={`${current === t.key ? "bg-emerald-500" : "bg-white/10 hover:bg-white/20"} border-0 text-white`}
              onClick={() => onNavigate(t.key)}
              aria-current={current === t.key ? "page" : undefined}
            >
              <t.icon className="mr-2 h-4 w-4" /> {t.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BottomNav({ current, onNavigate, tabs }: { current: TabKey; onNavigate: (k: TabKey) => void; tabs: readonly NavTab[] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/30 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegação principal">
      <div className="mx-auto grid max-w-5xl grid-cols-5 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            aria-current={current === t.key ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors duration-200 ${
              current === t.key ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <t.icon className={`h-5 w-5 ${current === t.key ? "" : "opacity-70"}`} />
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
