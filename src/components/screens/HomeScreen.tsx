import { useState, type ReactNode } from "react";
import { BookOpen, ListTodo } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import { dailyMissions, type DailyMissionId } from "../../game/missions";
import { levelInfo, localDateKey, weekDots, XP_GOAL_BONUS } from "../../game/progress";
import type { TranslationKey } from "../../i18n/translations";
import { isTask } from "../../game/tasks";
import { MODES } from "../../game/timerPresets";
import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Mascot, type MascotMood } from "../Mascot";
import { isClassItem, phaseSeconds, readArray, WEEKDAY_SHORT } from "./shared";
function ProgressBar({ value, max, color = "bg-emerald-400" }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ emoji, title, value, children }: { emoji: string; title: string; value: string; children?: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between text-sm font-semibold text-white/70">
        <span>{title}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {children}
    </div>
  );
}

const DAILY_MISSION_LABELS: Record<DailyMissionId, TranslationKey> = {
  "focus-one": "missionFocusOne",
  "focus-two": "missionFocusTwo",
  "task-one": "missionTaskOne",
  "task-two": "missionTaskTwo",
  "sleep-ideal": "missionSleepIdeal",
  "xp-20": "missionXp20",
};

export function HomeScreen({ onNavigate }: { onNavigate: (k: "agenda" | "pomodoro") => void }) {
  const { t } = useLanguage();
  const { progress, today, streak, timer, secondsLeft, startTimer, dailyGoalXP } = useGame();

  const [name] = useState<string>(() => {
    try {
      return localStorage.getItem("minday.profile.name") || "";
    } catch {
      return "";
    }
  });

  // Aulas e tarefas vêm da Agenda (lidas uma vez ao abrir a Home).
  const [agenda] = useState(() => {
    const now = new Date();
    const short = WEEKDAY_SHORT[now.getDay()];
    const key = localDateKey(now);
    const classes = readArray("minday.classes")
      .filter(isClassItem)
      .filter((c) => c.weekdays?.some((d) => d.slice(0, 3) === short))
      .sort((a, b) => a.time.localeCompare(b.time));
    const tasks = readArray("minday.tasks")
      .filter(isTask)
      .filter((task) => task.status !== "Concluída" && !!task.date && task.date.slice(0, 10) <= key)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return { classes, tasks, key };
  });

  const level = levelInfo(progress.xp);
  const goalReached = today.xp >= dailyGoalXP;
  const hour = new Date().getHours();
  const late = hour >= 22 || hour < 5;
  const focusing = timer.running && !timer.isBreak;
  const mood: MascotMood = focusing ? "focus" : goalReached ? "cheer" : late ? "sleepy" : "happy";

  const who = name && name !== "Usuário" ? name : "";
  const hi = who ? `Oi, ${who}!` : "Oi!";
  let message = `${hi} Bora fazer um foco rápido?`;
  if (focusing) message = "Foco ligado! Eu fico de olho no tempo.";
  else if (timer.running) message = "Descanse um pouco, você merece.";
  else if (goalReached) message = `Meta de hoje batida${who ? `, ${who}` : ""}! Que orgulho!`;
  else if (late) message = "Já está tarde. Dormir bem também faz parte de estudar!";
  else if (today.xp > 0) message = `Faltam ${dailyGoalXP - today.xp} XP para a meta de hoje.`;
  else if (streak > 0) message = `${hi} Sua sequência está em ${streak} ${streak === 1 ? "dia" : "dias"}. Vamos mantê-la hoje?`;

  const total = phaseSeconds(timer.mode, timer.isBreak);
  let ctaLabel = `Começar foco · ${MODES[timer.mode].study / 60} min`;
  if (timer.running) ctaLabel = `Voltar ao timer · ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  else if (timer.isBreak) ctaLabel = "Retomar descanso";
  else if (secondsLeft < total) ctaLabel = "Continuar foco";

  const startFocus = () => {
    startTimer();
    onNavigate("pomodoro");
  };

  const dots = weekDots(progress);
  const missions = dailyMissions(progress);

  return (
    <section className="space-y-6">
      <div className="flex items-end gap-4">
        <Mascot size={104} mood={mood} />
        <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 ring-1 ring-white/10">
          <p className="text-lg font-bold leading-snug">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={startFocus}
        className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-white shadow-[0_6px_0_0_#15803d] transition active:translate-y-1 active:shadow-[0_2px_0_0_#15803d]"
      >
        {ctaLabel}
      </button>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard emoji="🔥" title="Sequência" value={`${streak} ${streak === 1 ? "dia" : "dias"}`}>
          <p className="text-xs text-white/60">Melhor: {Math.max(progress.bestStreak, streak)}</p>
        </StatCard>
        <StatCard emoji="⭐" title={`Nível ${level.level}`} value={`${progress.xp} XP`}>
          <ProgressBar value={level.xpInLevel} max={level.xpForNext} color="bg-amber-400" />
          <p className="text-xs text-white/60">{level.xpInLevel}/{level.xpForNext} XP para o próximo nível</p>
        </StatCard>
        <StatCard emoji="🎯" title="Meta de hoje" value={`${Math.min(today.xp, dailyGoalXP)}/${dailyGoalXP} XP`}>
          <ProgressBar value={Math.min(today.xp, dailyGoalXP)} max={dailyGoalXP} color={goalReached ? "bg-emerald-400" : "bg-sky-400"} />
          <p className="text-xs text-white/60">{goalReached ? "Meta batida! ✓" : `+${XP_GOAL_BONUS} XP de bônus ao bater a meta`}</p>
        </StatCard>
      </div>

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-xl">{t("dailyMissionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-white/70" aria-live="polite">
            {today.missionsBonus ? t("dailyMissionsBonusReceived") : t("dailyMissionsHelp")}
          </p>
          <ul className="space-y-4">
            {missions.map((mission) => {
              const label = t(DAILY_MISSION_LABELS[mission.id]);
              const current = Math.min(mission.progress, mission.target);
              return (
                <li key={mission.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{label}</span>
                    <span className="shrink-0 text-sm text-white/70">
                      {mission.completed ? `✓ ${t("missionCompleted")}` : `${current}/${mission.target}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={mission.target}
                    aria-valuenow={current}
                    aria-valuetext={`${current} de ${mission.target}`}
                    className="h-2 overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${(current / mission.target) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
        {dots.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                d.active ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"
              } ${d.isToday ? "ring-2 ring-sky-400" : ""}`}
            >
              {d.active ? "✓" : ""}
            </div>
            <span className={`text-xs ${d.isToday ? "font-bold text-white" : "text-white/60"}`}>{d.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><BookOpen className="h-5 w-5"/> Aulas de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agenda.classes.length === 0 && <p className="text-white/70">Sem aulas cadastradas para hoje.</p>}
            {agenda.classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-2">
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-white/70">{c.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ListTodo className="h-5 w-5"/> Para fazer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agenda.tasks.length === 0 && <p className="text-white/70">Nada atrasado nem para hoje. 🎉</p>}
            {agenda.tasks.slice(0, 4).map((task) => {
              const overdue = (task.date ?? "").slice(0, 10) < agenda.key;
              return (
                <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-4 py-2">
                  <span className="font-semibold">{task.title}</span>
                  <span className={`text-xs font-bold uppercase ${overdue ? "text-rose-300" : "text-amber-300"}`}>
                    {overdue ? "atrasada" : "hoje"}
                  </span>
                </div>
              );
            })}
            {agenda.tasks.length > 4 && <p className="text-sm text-white/60">+{agenda.tasks.length - 4} na Agenda</p>}
            <button type="button" onClick={() => onNavigate("agenda")} className="text-sm font-semibold text-sky-300 hover:underline">
              Abrir Agenda →
            </button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
