import { createContext, useContext } from "react";
import type { Task } from "./tasks";
import type { DayStats, DailyGoalSettings, DailyGoalXP, Progress } from "./progress";
import type { TimerMode, TimerState } from "./timer";

export type ModeKey = TimerMode;
export type Toast = { id: number; text: string; sub?: string; tone: "xp" | "level" | "goal" | "info" };

export type GameCtx = {
  progress: Progress;
  today: DayStats;
  streak: number;
  dailyGoalSettings: DailyGoalSettings;
  dailyGoalXP: DailyGoalXP;
  timer: TimerState;
  secondsLeft: number;
  soundOn: boolean;
  toasts: Toast[];
  pendingTask: Pick<Task, "id" | "title"> | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  chooseMode: (mode: ModeKey) => void;
  selectTask: (taskId: string | null) => void;
  forgetTask: (taskId: string) => void;
  dismissPendingTask: () => void;
  confirmPendingTask: () => void;
  updateDailyGoal: (value: DailyGoalXP, timing: "immediate" | "next-day") => void;
  toggleSound: () => void;
  completeTask: (taskId: string) => void;
  completeSleep: (recordId: string, endedAtMs: number) => void;
};

export const GameContext = createContext<GameCtx | null>(null);

export function useGame(): GameCtx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame precisa ser usado dentro de <GameProvider>");
  return ctx;
}
