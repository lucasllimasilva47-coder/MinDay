import type { Task } from "../../game/tasks";
import { isRecord } from "../../game/progress";
import { MODES } from "../../game/timerPresets";
import { phaseSeconds as getTimerPhaseSeconds, type TimerDurations } from "../../game/timer";
import type { ModeKey } from "../../game/context";

export function phaseSeconds(mode: ModeKey, isBreak: boolean): number {
  return getTimerPhaseSeconds(MODES as TimerDurations, mode, isBreak);
}

export type ClassItem = { id: string; name: string; time: string; weekdays?: string[] };
export type SleepRecord = {
  id: string;
  start: string;
  end?: string;
  duration?: string;
  minutes?: number;
  quality?: "Inadequado" | "Adequado" | "Excessivo";
};

export const qualityKey = {
  Inadequado: "inadequado",
  Adequado: "adequado",
  Excessivo: "excessivo",
} as const;

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const ONBOARDING_KEY = "minday.onboarding.completed";

export function readArray(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function formatStudyTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes} min` : `${minutes} min`;
}

export function isClassItem(value: unknown): value is ClassItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.time === "string" &&
    (value.weekdays === undefined || Array.isArray(value.weekdays))
  );
}

export function badgeColor(status: Task["status"]): string {
  switch (status) {
    case "Pendente":
      return "bg-yellow-500";
    case "Em andamento":
      return "bg-sky-500";
    case "Concluída":
      return "bg-emerald-500";
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "Estudo":
      return "bg-purple-500";
    case "Tarefa":
      return "bg-sky-500";
    case "Projeto":
      return "bg-emerald-500";
    case "Pessoal":
      return "bg-rose-500";
    default:
      return "bg-gray-500";
  }
}

export function isSleepRecord(value: unknown): value is SleepRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.start === "string" &&
    (value.end === undefined || typeof value.end === "string") &&
    (value.duration === undefined || typeof value.duration === "string") &&
    (value.minutes === undefined || typeof value.minutes === "number") &&
    (value.quality === undefined ||
      value.quality === "Inadequado" ||
      value.quality === "Adequado" ||
      value.quality === "Excessivo")
  );
}

export function loadSleepRecords(): SleepRecord[] {
  return readArray("minday.sleep.records").filter(isSleepRecord);
}

export function fmtDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSleepQualityColor(quality: string): string {
  switch (quality) {
    case "Inadequado":
      return "bg-yellow-500";
    case "Adequado":
      return "bg-emerald-500";
    case "Excessivo":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

export function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
