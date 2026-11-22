import { useState } from "react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import { DAILY_GOAL_OPTIONS, DAILY_GOAL_XP, isDailyGoalXP, type DailyGoalXP } from "../../game/progress";
import { isSleepRange, loadSleepRange, saveSleepRange, SLEEP_RANGES, type SleepRange } from "../../game/sleep";
import { Card, Input } from "../ui";
import { Mascot } from "../Mascot";
import { ONBOARDING_KEY } from "./shared";
export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const { dailyGoalXP, updateDailyGoal } = useGame();
  const [name, setName] = useState("");
  const [sleepRange, setSleepRange] = useState<SleepRange>(loadSleepRange);
  const [goal, setGoal] = useState<DailyGoalXP>(dailyGoalXP);
  const [error, setError] = useState("");

  const finishSetup = () => {
    try {
      updateDailyGoal(goal, "immediate");
      const trimmedName = name.trim();
      if (trimmedName) localStorage.setItem("minday.profile.name", trimmedName);
      if (!saveSleepRange(sleepRange)) throw new Error("storage");
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    } catch (saveError) {
      console.error("Não foi possível salvar a configuração inicial.", saveError);
      setError(t("setupSaveError"));
    }
  };

  const skipSetup = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    } catch (saveError) {
      console.error("Não foi possível salvar que a configuração inicial foi pulada.", saveError);
      setError(t("setupSaveError"));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl bg-white/5 text-white">
        <div className="mb-6 text-center">
          <Mascot size={88} mood="cheer" />
          <h1 className="mt-3 text-2xl font-black">{t("onboardingTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("onboardingIntro")}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="onboarding-name" className="mb-2 block text-sm font-semibold">
              {t("name")} <span className="font-normal text-white/60">({t("optional")})</span>
            </label>
            <Input
              id="onboarding-name"
              value={name}
              onChange={(event: { target: { value: string } }) => setName(event.target.value)}
              maxLength={200}
              placeholder={t("enterName")}
              autoComplete="nickname"
            />
          </div>

          <div>
            <label htmlFor="onboarding-sleep-range" className="mb-2 block text-sm font-semibold">
              {t("sleepRange")}
            </label>
            <select
              id="onboarding-sleep-range"
              value={sleepRange}
              onChange={(event) => {
                if (isSleepRange(event.target.value)) setSleepRange(event.target.value);
              }}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <option value="teen">
                {SLEEP_RANGES.teen.label} · {SLEEP_RANGES.teen.min}–{SLEEP_RANGES.teen.max} h
              </option>
              <option value="adult">
                {SLEEP_RANGES.adult.label} · {SLEEP_RANGES.adult.min}–{SLEEP_RANGES.adult.max} h
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="onboarding-daily-goal" className="mb-2 block text-sm font-semibold">
              {t("dailyGoal")}
            </label>
            <select
              id="onboarding-daily-goal"
              value={goal}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (isDailyGoalXP(value)) setGoal(value);
              }}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {DAILY_GOAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} XP{option === DAILY_GOAL_XP ? ` · ${t("defaultOption")}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-white/60">{t("dailyGoalHelp")}</p>
          </div>

          {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={skipSetup}
              className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {t("skipSetup")}
            </button>
            <button
              type="button"
              onClick={finishSetup}
              className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {t("finishSetup")}
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}
