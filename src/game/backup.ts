// Backup do MinDay: exportar e importar todos os dados salvos no navegador.
// Lógica pura (recebe o "storage" como parâmetro), por isso dá para testar.

import { isDailyGoalSettings, isRecord } from "./progress";
import { isTask } from "./tasks";

export type StorageLike = {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const PREFIX = "minday.";
const MAX_FILE_CHARS = 2_000_000;

// Só estas chaves entram no backup. Ficam de fora as temporárias
// (timer, aba aberta e registro de sono em andamento).
const KEYS = [
  "minday.progress",
  "minday.recovery.progress",
  "minday.dailyGoalXP",
  "minday.onboarding.completed",
  "minday.tasks",
  "minday.classes",
  "minday.sleep.records",
  "minday.sleep.range",
  "minday.profile.name",
  "minday.profile.bio",
  "minday.sound",
] as const;

type Validator = (raw: string) => boolean;

function jsonArray(raw: string, item: (v: unknown) => boolean): boolean {
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) && data.every(item);
  } catch {
    return false;
  }
}

const isStr = (v: unknown): v is string => typeof v === "string";

const VALIDATORS: Record<(typeof KEYS)[number], Validator> = {
  "minday.recovery.progress": (raw) => raw.length <= MAX_FILE_CHARS,
  "minday.progress": (raw) => {
    try {
      const progress: unknown = JSON.parse(raw);
      if (!isRecord(progress)) return false;
      if (progress.xp !== undefined && (typeof progress.xp !== "number" || !Number.isFinite(progress.xp) || progress.xp < 0)) return false;
      if (progress.awardedTasks !== undefined && (!Array.isArray(progress.awardedTasks) || !progress.awardedTasks.every(isStr))) return false;
      if (progress.bestStreak !== undefined && (typeof progress.bestStreak !== "number" || !Number.isFinite(progress.bestStreak) || progress.bestStreak < 0)) return false;
      if (progress.days === undefined) return true;
      if (!isRecord(progress.days)) return false;
      return Object.values(progress.days).every(
        (day) =>
          isRecord(day) &&
          (day.xp === undefined || (typeof day.xp === "number" && Number.isFinite(day.xp) && day.xp >= 0)) &&
          (day.cycles === undefined || (typeof day.cycles === "number" && Number.isFinite(day.cycles) && day.cycles >= 0)) &&
          (day.tasks === undefined || (typeof day.tasks === "number" && Number.isFinite(day.tasks) && day.tasks >= 0)) &&
          (day.goalBonus === undefined || typeof day.goalBonus === "boolean") &&
          (day.sleep === undefined || typeof day.sleep === "boolean") &&
          (day.missionsBonus === undefined || typeof day.missionsBonus === "boolean")
      );
    } catch {
      return false;
    }
  },
  "minday.dailyGoalXP": (raw) => {
    try {
      return isDailyGoalSettings(JSON.parse(raw) as unknown);
    } catch {
      return false;
    }
  },
  "minday.onboarding.completed": (raw) => raw === "true",
  "minday.tasks": (raw) =>
    jsonArray(raw, isTask),
  "minday.classes": (raw) =>
    jsonArray(
      raw,
      (v) =>
        isRecord(v) &&
        isStr(v.id) &&
        v.id.length > 0 &&
        isStr(v.name) &&
        v.name.length > 0 &&
        isStr(v.time) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(v.time) &&
        (v.weekdays === undefined ||
          (Array.isArray(v.weekdays) &&
            v.weekdays.every((day) => typeof day === "string" && ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].includes(day))))
    ),
  "minday.sleep.records": (raw) =>
    jsonArray(
      raw,
      (v) =>
        isRecord(v) &&
        isStr(v.id) &&
        v.id.length > 0 &&
        isStr(v.start) &&
        !Number.isNaN(Date.parse(v.start)) &&
        (v.end === undefined || (isStr(v.end) && !Number.isNaN(Date.parse(v.end)))) &&
        (v.minutes === undefined || (typeof v.minutes === "number" && Number.isSafeInteger(v.minutes) && v.minutes >= 0)) &&
        (v.duration === undefined || isStr(v.duration)) &&
        (v.quality === undefined || v.quality === "Inadequado" || v.quality === "Adequado" || v.quality === "Excessivo")
    ),
  "minday.sleep.range": (raw) => raw === "teen" || raw === "adult",
  "minday.profile.name": (raw) => raw.length <= 200,
  "minday.profile.bio": (raw) => raw.length <= 400,
  "minday.sound": (raw) => raw === "on" || raw === "off",
};

export function buildBackup(storage: StorageLike, now: Date = new Date()): string {
  const data: Record<string, string> = {};
  const recoveryData = storage.getItem("minday.recovery.progress");
  for (const key of KEYS) {
    const value = storage.getItem(key);
    if (
      key === "minday.progress" &&
      value !== null &&
      recoveryData !== null &&
      !VALIDATORS[key](value)
    ) continue;
    if (value !== null) data[key] = value;
  }
  return JSON.stringify({ app: "minday", version: 1, exportedAt: now.toISOString(), data }, null, 2);
}

export type ParsedBackup = { ok: true; data: Record<string, string>; count: number } | { ok: false; error: string };

export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_FILE_CHARS) return { ok: false, error: "Arquivo grande demais para ser um backup do MinDay." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  if (!isRecord(parsed) || parsed.app !== "minday" || !isRecord(parsed.data)) {
    return { ok: false, error: "Esse arquivo não parece um backup do MinDay." };
  }
  const data: Record<string, string> = {};
  for (const key of KEYS) {
    const value = parsed.data[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || !VALIDATORS[key](value)) {
      return { ok: false, error: `O backup tem dados inválidos em "${key}". Nada foi alterado.` };
    }
    data[key] = value;
  }
  const count = Object.keys(data).length;
  if (count === 0) return { ok: false, error: "O backup não contém nenhum dado do MinDay." };
  return { ok: true, data, count };
}

// Restaura: apaga os dados do MinDay e grava os do backup.
export function applyBackup(storage: StorageLike, data: Record<string, string>): void {
  const previous: Record<string, string> = {};
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key !== null && key.startsWith(PREFIX)) {
      const value = storage.getItem(key);
      if (value !== null) previous[key] = value;
    }
  }

  try {
    wipeData(storage);
    for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
  } catch (error) {
    wipeData(storage);
    for (const [key, value] of Object.entries(previous)) storage.setItem(key, value);
    throw error;
  }
}

// Apaga TODOS os dados do MinDay salvos no navegador.
export function wipeData(storage: StorageLike): void {
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key !== null && key.startsWith(PREFIX)) toRemove.push(key);
  }
  toRemove.forEach((key) => storage.removeItem(key));
}
