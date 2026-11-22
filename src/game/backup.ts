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
  "minday.progress": (raw) => {
    try {
      const progress: unknown = JSON.parse(raw);
      if (!isRecord(progress)) return false;
      if (!isRecord(progress.days)) return true;
      return Object.values(progress.days).every(
        (day) => !isRecord(day) || day.missionsBonus === undefined || typeof day.missionsBonus === "boolean"
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
      (v) => isRecord(v) && isStr(v.id) && isStr(v.name) && isStr(v.time) && (v.weekdays === undefined || Array.isArray(v.weekdays))
    ),
  "minday.sleep.records": (raw) => jsonArray(raw, (v) => isRecord(v) && isStr(v.id) && isStr(v.start)),
  "minday.sleep.range": (raw) => raw === "teen" || raw === "adult",
  "minday.profile.name": (raw) => raw.length <= 200,
  "minday.profile.bio": (raw) => raw.length <= 400,
  "minday.sound": (raw) => raw === "on" || raw === "off",
};

export function buildBackup(storage: StorageLike, now: Date = new Date()): string {
  const data: Record<string, string> = {};
  for (const key of KEYS) {
    const value = storage.getItem(key);
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
  wipeData(storage);
  for (const [key, value] of Object.entries(data)) storage.setItem(key, value);
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