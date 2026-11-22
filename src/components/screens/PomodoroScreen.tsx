import { useEffect, useState } from "react";
import { CheckCircle2, Pause, Play, RefreshCw } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame, type ModeKey } from "../../game/context";
import type { Task } from "../../game/tasks";
import { loadTaskRecords, TASKS_UPDATED_EVENT } from "../../game/taskStorage";
import { XP_CYCLE, XP_GOAL_BONUS, XP_PER_LEVEL, XP_TASK, XP_TASK_DAILY_CAP } from "../../game/progress";
import { MODES } from "../../game/timerPresets";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ui";
import { phaseSeconds } from "./shared";
import { Colon } from "./ScreenControls";
export function PomodoroScreen() {
  const { t } = useLanguage();
  const {
    timer,
    secondsLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    chooseMode,
    selectTask,
    dailyGoalXP,
    today,
    soundOn,
    toggleSound,
  } = useGame();
  const [tasks, setTasks] = useState<Task[]>(loadTaskRecords);

  useEffect(() => {
    const refreshTasks = () => setTasks(loadTaskRecords());
    window.addEventListener(TASKS_UPDATED_EVENT, refreshTasks);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, refreshTasks);
  }, []);

  const total = phaseSeconds(timer.mode, timer.isBreak);
  const taskSelectionDisabled = !timer.isBreak && (timer.running || secondsLeft < total);
  const fraction = Math.min(1, Math.max(0, secondsLeft / total));
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const ringColor = timer.isBreak ? "#38bdf8" : MODES[timer.mode].color;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">{t("pomodoro")}</CardTitle>
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
          >
            {soundOn ? "🔔 Som ligado" : "🔕 Som desligado"}
          </button>
        </CardHeader>
        <CardContent className="space-y-6 text-white">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODES) as ModeKey[]).map((k) => {
              const studyM = Math.round(MODES[k].study / 60);
              const breakM = Math.round(MODES[k].break / 60);
              const label = k === "Facil" ? t("easy") : k === "Medio" ? t("medium") : t("hard");
              return (
                <Button
                  key={k}
                  onClick={() => chooseMode(k)}
                  disabled={timer.running}
                  className={`border-0 disabled:cursor-not-allowed ${k === timer.mode ? "" : "opacity-70"}`}
                  style={{ background: MODES[k].color }}
                >
                  {label} {studyM}/{breakM} min
                </Button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="pomodoro-task" className="block text-sm font-semibold text-white/90">
              {t("taskForFocus")}
            </label>
            <select
              id="pomodoro-task"
              value={timer.taskId ?? ""}
              onChange={(event) => selectTask(event.target.value || null)}
              disabled={taskSelectionDisabled}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{t("noTaskSelected")}</option>
              {tasks
                .filter((task) => task.status !== "Concluída")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            {tasks.every((task) => task.status === "Concluída") && (
              <p className="text-sm text-white/60">{t("noTasksForFocus")}</p>
            )}
          </div>

          <div className="rounded-3xl bg-black/20 p-4 text-center sm:p-6">
            <div
              className="relative mx-auto h-52 w-52 max-w-full sm:h-56 sm:w-56"
              role="timer"
              aria-live="polite"
              aria-label={`${timer.isBreak ? t("break") : t("study")}: ${mm}:${ss}`}
            >
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction)}
                  style={{ transition: "stroke-dashoffset 0.4s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs uppercase tracking-widest text-white/70">{timer.isBreak ? t("break") : t("study")}</div>
                <div className="mt-1 flex items-center gap-2 text-5xl font-black">
                  <span>{mm}</span>
                  <Colon size={14} />
                  <span>{ss}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={timer.running ? pauseTimer : startTimer}
                className="flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#15803d] transition active:translate-y-1 active:shadow-[0_1px_0_0_#15803d]"
              >
                {timer.running ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                {timer.running ? t("pause") : secondsLeft < total ? "Continuar" : t("start")}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="flex items-center justify-center rounded-2xl bg-rose-500 px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#be123c] transition active:translate-y-1 active:shadow-[0_1px_0_0_#be123c]"
              >
                <RefreshCw className="mr-2 h-4 w-4"/>{t("reset")}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5"/> {t("cyclesCompleted")} hoje: <span className="font-bold text-white">{today.cycles}</span>
            </div>
            <div className="text-sm text-white/60">Concluir este foco rende +{XP_CYCLE[timer.mode]} XP</div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{t("quickTip")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-white/80">
            <p>{t("pomodoroTip")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Como ganhar XP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <p>Foco concluído: +{XP_CYCLE.Facil} (fácil), +{XP_CYCLE.Medio} (médio) ou +{XP_CYCLE.Dificil} (difícil) XP.</p>
            <p>Tarefa concluída na Agenda: +{XP_TASK} XP (até {XP_TASK_DAILY_CAP} por dia).</p>
            <p>Bateu {dailyGoalXP} XP no dia: bônus de +{XP_GOAL_BONUS} XP.</p>
            <p>A cada {XP_PER_LEVEL} XP você sobe de nível.</p>
            <p className="text-white/60">Se fechar a página no meio de um foco, o ciclo não conta.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
