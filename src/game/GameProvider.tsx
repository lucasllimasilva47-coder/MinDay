import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { addStudyTime, type Task } from "./tasks";
import { loadTaskRecords, saveTaskRecords, TASKS_UPDATED_EVENT } from "./taskStorage";
import { awardDailyMissionsBonus, XP_DAILY_MISSIONS_BONUS } from "./missions";
import {
  XP_CYCLE,
  XP_GOAL_BONUS,
  XP_SLEEP,
  XP_TASK,
  XP_TASK_DAILY_CAP,
  addXp,
  awardSleep,
  awardTask,
  activatePendingDailyGoal,
  currentStreak,
  dailyGoalForDate,
  immediateDailyGoalChange,
  loadDailyGoalSettings,
  loadProgress,
  localDateKey,
  saveDailyGoalSettings,
  saveProgress,
  scheduleDailyGoalChange,
  todayStats,
  type DailyGoalSettings,
  type DailyGoalXP,
  type Progress,
  type XpResult,
} from "./progress";
import {
  freshTimer as createFreshTimer,
  reconcileTimer,
  remainingSeconds as timerRemainingSeconds,
  type TimerDurations,
  type TimerState,
} from "./timer";
import { safeGet, safeSet } from "./storage";
import { GameContext, type GameCtx, type ModeKey, type Toast } from "./context";
import { MODES } from "./timerPresets";
const TIMER_KEY = "minday.timer";
const SOUND_KEY = "minday.sound";
const BASE_TITLE = "MinDay - Organize seu dia com diversão";

function freshTimer(mode: ModeKey, taskId: string | null = null): TimerState {
  return createFreshTimer(MODES as TimerDurations, mode, taskId);
}

function loadTimer(): TimerState {
  try {
    const raw = safeGet(localStorage, TIMER_KEY);
    if (!raw) return freshTimer("Facil");
    return reconcileTimer(JSON.parse(raw) as unknown, MODES as TimerDurations, Date.now());
  } catch {
    return freshTimer("Facil");
  }
}

// O tempo restante vem do RELÓGIO (instante final menos agora), não de uma conta
// "menos 1 a cada tick". Assim, se o navegador atrasar o timer numa aba escondida,
// o resultado continua certo.
function remainingSeconds(t: TimerState, nowMs: number): number {
  return timerRemainingSeconds(t, nowMs);
}

function loadSound(): boolean {
  return safeGet(localStorage, SOUND_KEY) !== "off";
}

let audioCtx: AudioContext | null = null;

function playTones(freqs: number[]): void {
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.16;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    });
  } catch {
    // sem áudio disponível: o app segue normalmente, só sem som
  }
}

const CELEBRATE = [523, 659, 784, 1047];
const DONE = [659, 880];

export function GameProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [dailyGoalSettings, setDailyGoalSettings] = useState<DailyGoalSettings>(loadDailyGoalSettings);
  const [timer, setTimer] = useState<TimerState>(loadTimer);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => remainingSeconds(timer, Date.now()));
  const [soundOn, setSoundOn] = useState<boolean>(loadSound);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingTask, setPendingTask] = useState<Pick<Task, "id" | "title"> | null>(null);

  // Refs guardam o valor mais recente para o relógio, que roda fora da renderização.
  const progressRef = useRef<Progress>(progress);
  const dailyGoalSettingsRef = useRef<DailyGoalSettings>(dailyGoalSettings);
  const dailyGoalRef = useRef<DailyGoalXP>(dailyGoalForDate(dailyGoalSettings));
  const observedDateRef = useRef<string>(localDateKey());
  const timerRef = useRef<TimerState>(timer);
  const soundRef = useRef<boolean>(soundOn);
  const toastSeq = useRef<number>(0);

  const pushToast = useCallback((text: string, tone: Toast["tone"], sub?: string) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, sub, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);

  const updateDailyGoal = useCallback((value: DailyGoalXP, timing: "immediate" | "next-day") => {
    const now = new Date();
    const next =
      timing === "immediate"
        ? immediateDailyGoalChange(value)
        : scheduleDailyGoalChange(dailyGoalSettingsRef.current, value, now);
    saveDailyGoalSettings(next);
    dailyGoalSettingsRef.current = next;
    dailyGoalRef.current = dailyGoalForDate(next, now);
    setDailyGoalSettings(next);
  }, []);

  // Importante: o XP é dado aqui, em eventos, e nunca dentro de uma função
  // passada ao setState (no StrictMode o React a executa duas vezes e o XP dobraria).
  const commitXp = useCallback(
    (result: XpResult, amount: number, label: string) => {
      progressRef.current = result.progress;
      setProgress(result.progress);
      pushToast(`+${amount} XP`, "xp", label);
      if (result.goalReached) pushToast(`Meta do dia batida! +${XP_GOAL_BONUS} XP`, "goal");
      if (result.leveledUp) pushToast(`Você chegou ao nível ${result.level}!`, "level");
    },
    [pushToast]
  );

  const checkDailyMissionBonus = useCallback(() => {
    const result = awardDailyMissionsBonus(progressRef.current, dailyGoalRef.current);
    if (!result) return;
    commitXp(result, XP_DAILY_MISSIONS_BONUS, t("dailyMissionsBonusToast"));
  }, [commitXp, t]);

  const completeTask = useCallback(
    (taskId: string) => {
      const award = awardTask(progressRef.current, taskId, new Date(), dailyGoalRef.current);
      if (!award.ok) {
        if (award.reason === "cap") {
          pushToast("Limite diário de tarefas", "info", `Só ${XP_TASK_DAILY_CAP} tarefas por dia dão XP. Que tal um foco?`);
        }
        return;
      }
      commitXp(award.result, XP_TASK, "Tarefa concluída");
      checkDailyMissionBonus();
      if (soundRef.current) playTones(award.result.goalReached || award.result.leveledUp ? CELEBRATE : DONE);
    },
    [checkDailyMissionBonus, commitXp, pushToast]
  );

  const completeSleep = useCallback(
    (recordId: string, endedAtMs: number) => {
      const award = awardSleep(progressRef.current, recordId, endedAtMs, new Date(), dailyGoalRef.current);
      if (!award.ok) {
        if (award.reason === "cap") pushToast("Sono de hoje já valeu XP", "info", "Só uma noite por dia rende XP");
        return;
      }
      commitXp(award.result, XP_SLEEP, "Boa noite de sono");
      checkDailyMissionBonus();
      if (soundRef.current) playTones(award.result.goalReached || award.result.leveledUp ? CELEBRATE : DONE);
    },
    [checkDailyMissionBonus, commitXp, pushToast]
  );

  const applyTimer = useCallback((next: TimerState) => {
    timerRef.current = next;
    setTimer(next);
    setSecondsLeft(remainingSeconds(next, Date.now()));
  }, []);

  const selectTask = useCallback(
    (taskId: string | null) => {
      const current = timerRef.current;
      if (!current.isBreak && (current.running || current.left !== MODES[current.mode].study)) return;
      if (taskId !== null) {
        const task = loadTaskRecords().find((item) => item.id === taskId && item.status !== "Concluída");
        if (!task) {
          pushToast("Essa tarefa não está mais disponível.", "info");
          return;
        }
      }
      applyTimer({ ...current, taskId });
    },
    [applyTimer, pushToast]
  );

  const forgetTask = useCallback(
    (taskId: string) => {
      const current = timerRef.current;
      if (current.taskId === taskId) applyTimer({ ...current, taskId: null });
      setPendingTask((pending) => (pending?.id === taskId ? null : pending));
    },
    [applyTimer]
  );

  const dismissPendingTask = useCallback(() => setPendingTask(null), []);

  const confirmPendingTask = useCallback(() => {
    if (!pendingTask) return;
    const tasks = loadTaskRecords();
    const task = tasks.find((item) => item.id === pendingTask.id);
    if (!task || task.status === "Concluída") {
      setPendingTask(null);
      return;
    }

    try {
      saveTaskRecords(tasks.map((item) => (item.id === task.id ? { ...item, status: "Concluída" } : item)));
    } catch (error) {
      console.error("Não foi possível salvar a conclusão da tarefa.", error);
      pushToast("Não foi possível salvar a tarefa. Tente novamente.", "info");
      return;
    }

    window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
    setPendingTask(null);
    const current = timerRef.current;
    if (current.taskId === task.id) applyTimer({ ...current, taskId: null });
    completeTask(task.id);
  }, [applyTimer, completeTask, pendingTask, pushToast]);

  const finishPhase = useCallback(
    (t: TimerState) => {
      const now = Date.now();
      if (!t.isBreak) {
        // Terminou um foco: dá XP e começa o descanso sozinho.
        const amount = XP_CYCLE[t.mode];
        const result = addXp(progressRef.current, amount, "cycle", new Date(), dailyGoalRef.current);
        commitXp(result, amount, "Foco concluído");
        checkDailyMissionBonus();
        let nextTaskId = t.taskId;
        if (t.taskId) {
          const tasks = loadTaskRecords();
          const task = tasks.find((item) => item.id === t.taskId);
          if (!task) {
            nextTaskId = null;
          } else {
            try {
              saveTaskRecords(addStudyTime(tasks, task.id, MODES[t.mode].study));
              window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
              if (task.status === "Concluída") {
                nextTaskId = null;
              } else {
                setPendingTask({ id: task.id, title: task.title });
              }
            } catch (error) {
              console.error("Não foi possível salvar o tempo estudado na tarefa.", error);
              pushToast("O foco foi concluído, mas não foi possível salvar o tempo estudado.", "info");
              nextTaskId = null;
            }
          }
        }
        const breakSec = MODES[t.mode].break;
        pushToast("Hora do descanso", "info", `${breakSec / 60} min para respirar`);
        applyTimer({
          mode: t.mode,
          isBreak: true,
          running: true,
          endAt: now + breakSec * 1000,
          left: breakSec,
          taskId: nextTaskId,
        });
        if (soundRef.current) playTones(result.goalReached || result.leveledUp ? CELEBRATE : DONE);
      } else {
        // Terminou o descanso: para e espera você. Assim ninguém ganha XP
        // com o timer rodando sozinho enquanto está longe.
        pushToast("Descanso acabou", "info", "Quando quiser, comece o próximo foco");
        applyTimer(freshTimer(t.mode, t.taskId));
        if (soundRef.current) playTones([784, 659]);
      }
    },
    [applyTimer, checkDailyMissionBonus, commitXp, pushToast]
  );

  // Confere uma vez por segundo; o tempo restante continua vindo do instante final.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = timerRef.current;
      if (!t.running || t.endAt === null) return;
      const remaining = Math.ceil((t.endAt - Date.now()) / 1000);
      if (remaining > 0) setSecondsLeft(remaining);
      else finishPhase(t);
    }, 1000);
    return () => window.clearInterval(id);
  }, [finishPhase]);

  const startTimer = useCallback(() => {
    const t = timerRef.current;
    if (t.running) return;
    applyTimer({ ...t, running: true, endAt: Date.now() + t.left * 1000 });
  }, [applyTimer]);

  const pauseTimer = useCallback(() => {
    const t = timerRef.current;
    if (!t.running) return;
    applyTimer({ ...t, running: false, endAt: null, left: remainingSeconds(t, Date.now()) });
  }, [applyTimer]);

  const resetTimer = useCallback(() => {
    const current = timerRef.current;
    applyTimer(freshTimer(current.mode, current.taskId));
  }, [applyTimer]);
  const chooseMode = useCallback((mode: ModeKey) => {
    applyTimer(freshTimer(mode, timerRef.current.taskId));
  }, [applyTimer]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    safeSet(localStorage, SOUND_KEY, next ? "on" : "off");
  }, []);

  useEffect(() => {
    if (!saveProgress(progress)) {
      pushToast("Não foi possível salvar seu progresso", "info", "Verifique o armazenamento do navegador");
    }
  }, [progress, pushToast]);
  useEffect(() => checkDailyMissionBonus(), [checkDailyMissionBonus]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date();
      const dateKey = localDateKey(now);
      if (dateKey === observedDateRef.current) return;
      observedDateRef.current = dateKey;
      const current = dailyGoalSettingsRef.current;
      const next = activatePendingDailyGoal(current, now);
      if (next === current) return;

      dailyGoalSettingsRef.current = next;
      dailyGoalRef.current = next.current;
      setDailyGoalSettings(next);
      try {
        saveDailyGoalSettings(next);
      } catch (error) {
        console.error("A meta começou a valer, mas não foi possível salvar a configuração atualizada.", error);
        pushToast("A meta mudou, mas não foi possível salvar essa alteração.", "info");
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [pushToast]);

  useEffect(() => {
    safeSet(localStorage, TIMER_KEY, JSON.stringify(timer));
  }, [timer]);

  // Mostra o tempo no título da aba (dá para acompanhar de outra aba).
  useEffect(() => {
    if (!timer.running) {
      document.title = BASE_TITLE;
      return;
    }
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    document.title = `${mm}:${ss} · ${timer.isBreak ? "Descanso" : "Foco"} · MinDay`;
  }, [timer.running, timer.isBreak, secondsLeft]);

  const value: GameCtx = {
    progress,
    today: todayStats(progress),
    streak: currentStreak(progress),
    dailyGoalSettings,
    dailyGoalXP: dailyGoalRef.current,
    timer,
    secondsLeft,
    soundOn,
    toasts,
    pendingTask,
    startTimer,
    pauseTimer,
    resetTimer,
    chooseMode,
    selectTask,
    forgetTask,
    dismissPendingTask,
    confirmPendingTask,
    updateDailyGoal,
    toggleSound,
    completeTask,
    completeSleep,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
