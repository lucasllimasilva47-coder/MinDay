import { useEffect, useRef } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame, type Toast } from "../../game/context";
const TOAST_TONE: Record<Toast["tone"], string> = {
  xp: "bg-emerald-500 text-white",
  level: "bg-amber-400 text-slate-900",
  goal: "bg-sky-500 text-white",
  info: "bg-white/90 text-slate-900",
};

export function ToastLayer() {
  const { toasts } = useGame();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2 px-4 sm:bottom-8"
      aria-live="polite"
    >
      {toasts.map((x) => (
        <div key={x.id} className={`animate-pop rounded-2xl px-5 py-3 text-center shadow-xl ${TOAST_TONE[x.tone]}`}>
          <div className="text-lg font-extrabold">{x.text}</div>
          {x.sub && <div className="text-xs font-semibold opacity-90">{x.sub}</div>}
        </div>
      ))}
    </div>
  );
}


export function TaskCompletionPrompt() {
  const { t } = useLanguage();
  const { pendingTask, dismissPendingTask, confirmPendingTask } = useGame();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pendingTask) {
      const activeElement = document.activeElement;
      previouslyFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      dismissButtonRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [pendingTask]);

  useEffect(() => {
    if (!pendingTask) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissPendingTask();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissPendingTask, pendingTask]);

  if (!pendingTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-completion-title"
        aria-describedby="task-completion-description"
        className="w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl ring-1 ring-white/20"
      >
        <h2 id="task-completion-title" className="text-xl font-bold">
          {t("markTaskCompleteQuestion")}
        </h2>
        <p id="task-completion-description" className="mt-3 text-white/80">
          {pendingTask.title}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={dismissPendingTask}
            className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {t("notNow")}
          </button>
          <button
            type="button"
            onClick={confirmPendingTask}
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {t("markTaskComplete")}
          </button>
        </div>
      </div>
    </div>
  );
}
