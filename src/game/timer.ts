export type TimerMode = "Facil" | "Medio" | "Dificil";

export type TimerDurations = Record<TimerMode, { study: number; break: number }>;

export type TimerState = {
  mode: TimerMode;
  isBreak: boolean;
  running: boolean;
  endAt: number | null;
  left: number;
  taskId: string | null;
};

export function isTimerMode(value: unknown): value is TimerMode {
  return value === "Facil" || value === "Medio" || value === "Dificil";
}

export function phaseSeconds(durations: TimerDurations, mode: TimerMode, isBreak: boolean): number {
  return isBreak ? durations[mode].break : durations[mode].study;
}

export function freshTimer(durations: TimerDurations, mode: TimerMode, taskId: string | null = null): TimerState {
  return {
    mode,
    isBreak: false,
    running: false,
    endAt: null,
    left: phaseSeconds(durations, mode, false),
    taskId,
  };
}

export function remainingSeconds(timer: TimerState, nowMs: number): number {
  if (timer.running && timer.endAt !== null) {
    return Math.max(1, Math.ceil((timer.endAt - nowMs) / 1000));
  }
  return timer.left;
}

export function reconcileTimer(
  value: unknown,
  durations: TimerDurations,
  nowMs: number
): TimerState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return freshTimer(durations, "Facil");
  }

  const data = value as Record<string, unknown>;
  const mode = isTimerMode(data.mode) ? data.mode : "Facil";
  const isBreak = data.isBreak === true;
  const taskId =
    typeof data.taskId === "string" && data.taskId.length > 0 && data.taskId.length <= 200
      ? data.taskId
      : null;
  const total = phaseSeconds(durations, mode, isBreak);

  if (data.running === true && typeof data.endAt === "number" && Number.isFinite(data.endAt)) {
    if (data.endAt > nowMs) {
      return { mode, isBreak, running: true, endAt: data.endAt, left: total, taskId };
    }
    return freshTimer(durations, mode, taskId);
  }

  const left =
    typeof data.left === "number"
      ? Math.min(total, Math.max(1, Math.round(data.left)))
      : total;
  return { mode, isBreak, running: false, endAt: null, left, taskId };
}
