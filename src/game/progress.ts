import { migrateLegacyData, safeSet } from "./storage";

// Regras do "jogo" do MinDay.
// Aqui só existe lógica pura (sem React): fica fácil de ler, mudar e testar.
// Para ajustar a dificuldade do jogo, mexa nas constantes logo abaixo.

export type Difficulty = "Facil" | "Medio" | "Dificil";

export const DAILY_GOAL_XP = 50; // meta de XP por dia
export const DAILY_GOAL_OPTIONS = [30, 50, 75] as const;
export type DailyGoalXP = (typeof DAILY_GOAL_OPTIONS)[number];
export type DailyGoalSettings = {
  current: DailyGoalXP;
  pending: { value: DailyGoalXP; startsOn: string } | null;
};
export const XP_GOAL_BONUS = 15; // bônus ao bater a meta (1x por dia)
export const XP_PER_LEVEL = 100; // a cada 100 XP sobe um nível
export const XP_TASK = 10; // XP por tarefa concluída
export const XP_TASK_DAILY_CAP = 5; // máximo de tarefas que dão XP por dia
export const XP_SLEEP = 15; // XP por uma noite dentro da faixa ideal (1x por dia)
const SLEEP_AWARD_WINDOW_MS = 36 * 60 * 60 * 1000; // só vale se a noite terminou há até 36 h
export const XP_CYCLE: Record<Difficulty, number> = {
  Facil: 20,
  Medio: 35,
  Dificil: 50,
};

const STORAGE_KEY = "minday.progress";
const RECOVERY_STORAGE_KEY = "minday.recovery.progress";
const DAILY_GOAL_STORAGE_KEY = "minday.dailyGoalXP";
let progressSaveBlocked = false;

export type DayStats = {
  xp: number;
  cycles: number;
  tasks: number;
  goalBonus?: boolean;
  sleep?: boolean; // já ganhou XP de sono neste dia
  missionsBonus?: boolean;
};

export type Progress = {
  xp: number; // XP total
  days: Record<string, DayStats>; // chave = dia local, ex.: "2026-11-21"
  awardedTasks: string[]; // tarefas que já deram XP (impede ganhar de novo)
  bestStreak: number; // melhor sequência de dias
};

export type XpResult = {
  progress: Progress;
  gained: number;
  goalReached: boolean;
  leveledUp: boolean;
  level: number;
};

export type TaskAward =
  | { ok: true; result: XpResult }
  | { ok: false; reason: "already" | "cap" };

export type SleepAward =
  | { ok: true; result: XpResult }
  | { ok: false; reason: "already" | "cap" | "old" };

// ---------- datas (sempre no fuso do usuário) ----------

// Atenção: toISOString() devolve a data em UTC e, no Brasil, "vira o dia"
// às 21h. Por isso o dia é montado a partir das partes locais da data.
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDailyGoalXP(value: unknown): value is DailyGoalXP {
  return typeof value === "number" && DAILY_GOAL_OPTIONS.some((option) => option === value);
}

function isLocalDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day >= 1 && day <= daysInMonth;
}

export function isDailyGoalSettings(value: unknown): value is DailyGoalSettings {
  if (!isRecord(value) || !isDailyGoalXP(value.current)) return false;
  if (value.pending === null) return true;
  return (
    isRecord(value.pending) &&
    isDailyGoalXP(value.pending.value) &&
    isLocalDateKey(value.pending.startsOn)
  );
}

export function defaultDailyGoalSettings(): DailyGoalSettings {
  return { current: DAILY_GOAL_XP, pending: null };
}

export function dailyGoalForDate(settings: DailyGoalSettings, now: Date = new Date()): DailyGoalXP {
  if (settings.pending && settings.pending.startsOn <= localDateKey(now)) return settings.pending.value;
  return settings.current;
}

export function activatePendingDailyGoal(
  settings: DailyGoalSettings,
  now: Date = new Date()
): DailyGoalSettings {
  if (!settings.pending || settings.pending.startsOn > localDateKey(now)) return settings;
  return { current: settings.pending.value, pending: null };
}

export function scheduleDailyGoalChange(
  settings: DailyGoalSettings,
  value: DailyGoalXP,
  now: Date = new Date()
): DailyGoalSettings {
  const activeSettings = activatePendingDailyGoal(settings, now);
  if (value === activeSettings.current) return activeSettings;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return {
    current: activeSettings.current,
    pending: { value, startsOn: localDateKey(tomorrow) },
  };
}

export function immediateDailyGoalChange(value: DailyGoalXP): DailyGoalSettings {
  return { current: value, pending: null };
}

export function loadDailyGoalSettings(): DailyGoalSettings {
  try {
    const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    if (raw === null) return defaultDailyGoalSettings();
    const parsed: unknown = JSON.parse(raw);
    if (!isDailyGoalSettings(parsed)) {
      console.error("A configuração salva da meta diária é inválida; será usada a meta padrão.");
      return defaultDailyGoalSettings();
    }
    return activatePendingDailyGoal(parsed);
  } catch (error) {
    console.error("Não foi possível carregar a meta diária salva.", error);
    return defaultDailyGoalSettings();
  }
}

export function saveDailyGoalSettings(settings: DailyGoalSettings): void {
  if (!isDailyGoalSettings(settings)) {
    throw new TypeError("A configuração da meta diária é inválida.");
  }
  localStorage.setItem(DAILY_GOAL_STORAGE_KEY, JSON.stringify(settings));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// "2026-11-21" -> "21/11/2026" (sem passar por new Date, que erraria o fuso)
export function formatDateBR(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(key);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : key;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ---------- XP, nível e sequência ----------

export function emptyProgress(): Progress {
  return { xp: 0, days: {}, awardedTasks: [], bestStreak: 0 };
}

export function levelInfo(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpForNext: XP_PER_LEVEL,
  };
}

export function todayStats(p: Progress, now: Date = new Date()): DayStats {
  return p.days[localDateKey(now)] ?? { xp: 0, cycles: 0, tasks: 0 };
}

// Dias seguidos com algum XP. Se hoje ainda não teve XP, a sequência
// continua viva (conta a partir de ontem) até a meia-noite.
export function currentStreak(p: Progress, now: Date = new Date()): number {
  const active = (d: Date): boolean => (p.days[localDateKey(d)]?.xp ?? 0) > 0;
  let cursor = active(now) ? now : addDays(now, -1);
  let count = 0;
  while (active(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function addXp(
  p: Progress,
  amount: number,
  kind: "cycle" | "task" | "sleep" | "mission",
  now: Date = new Date(),
  dailyGoalXP: DailyGoalXP = DAILY_GOAL_XP
): XpResult {
  const key = localDateKey(now);
  const day = todayStats(p, now);
  const next: DayStats = {
    ...day,
    xp: day.xp + amount,
    cycles: day.cycles + (kind === "cycle" ? 1 : 0),
    tasks: day.tasks + (kind === "task" ? 1 : 0),
  };
  if (kind === "sleep") next.sleep = true;

  let gained = amount;
  let goalReached = false;
  if (!day.goalBonus && next.xp >= dailyGoalXP) {
    next.xp += XP_GOAL_BONUS;
    next.goalBonus = true;
    gained += XP_GOAL_BONUS;
    goalReached = true;
  }

  const xp = p.xp + gained;
  const progress: Progress = { ...p, xp, days: { ...p.days, [key]: next } };
  progress.bestStreak = Math.max(p.bestStreak, currentStreak(progress, now));

  const before = levelInfo(p.xp).level;
  const after = levelInfo(xp).level;
  return { progress, gained, goalReached, leveledUp: after > before, level: after };
}

// Cada tarefa só dá XP uma vez, e há um limite por dia (senão bastaria
// criar e concluir tarefas à toa para juntar pontos).
export function awardTask(
  p: Progress,
  taskId: string,
  now: Date = new Date(),
  dailyGoalXP: DailyGoalXP = DAILY_GOAL_XP
): TaskAward {
  if (p.awardedTasks.includes(taskId)) return { ok: false, reason: "already" };
  if (todayStats(p, now).tasks >= XP_TASK_DAILY_CAP) return { ok: false, reason: "cap" };
  const result = addXp(p, XP_TASK, "task", now, dailyGoalXP);
  const awardedTasks = [...p.awardedTasks, taskId].slice(-500);
  return { ok: true, result: { ...result, progress: { ...result.progress, awardedTasks } } };
}

// XP por uma noite dentro da faixa ideal. Vale 1x por dia, só para noites que
// terminaram há pouco (36 h), e cada registro só pode render XP uma vez.
export function awardSleep(
  p: Progress,
  recordId: string,
  endedAtMs: number,
  now: Date = new Date(),
  dailyGoalXP: DailyGoalXP = DAILY_GOAL_XP
): SleepAward {
  const id = `sleep:${recordId}`;
  if (p.awardedTasks.includes(id)) return { ok: false, reason: "already" };
  const age = now.getTime() - endedAtMs;
  if (age < 0 || age > SLEEP_AWARD_WINDOW_MS) return { ok: false, reason: "old" };
  if (todayStats(p, now).sleep) return { ok: false, reason: "cap" };
  const result = addXp(p, XP_SLEEP, "sleep", now, dailyGoalXP);
  const awardedTasks = [...p.awardedTasks, id].slice(-500);
  return { ok: true, result: { ...result, progress: { ...result.progress, awardedTasks } } };
}

export type WeekDot = { key: string; label: string; active: boolean; isToday: boolean };

export function weekDots(p: Progress, now: Date = new Date()): WeekDot[] {
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const dots: WeekDot[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = addDays(now, -i);
    const key = localDateKey(d);
    dots.push({ key, label: labels[d.getDay()], active: (p.days[key]?.xp ?? 0) > 0, isToday: i === 0 });
  }
  return dots;
}

// ---------- salvar / carregar ----------

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
}

// Não confia no que está no localStorage: valida o formato antes de usar.
function sanitize(data: unknown): Progress {
  if (!isRecord(data)) return emptyProgress();
  const days: Record<string, DayStats> = {};
  if (isRecord(data.days)) {
    for (const [key, v] of Object.entries(data.days)) {
      if (!isLocalDateKey(key) || !isRecord(v)) continue;
      days[key] = {
        xp: num(v.xp),
        cycles: num(v.cycles),
        tasks: num(v.tasks),
        goalBonus: v.goalBonus === true,
        sleep: v.sleep === true,
        missionsBonus: v.missionsBonus === true,
      };
    }
  }
  const awardedTasks = Array.isArray(data.awardedTasks)
    ? data.awardedTasks.filter((x): x is string => typeof x === "string")
    : [];
  return { xp: num(data.xp), days, awardedTasks, bestStreak: num(data.bestStreak) };
}

export function loadProgress(): Progress {
  let raw: string | null = null;
  try {
    migrateLegacyData(localStorage);
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
  } catch {
    console.error("Não foi possível ler o progresso salvo.");
    return emptyProgress();
  }
  try {
    return sanitize(JSON.parse(raw) as unknown);
  } catch (error) {
    console.error("O progresso salvo não é um JSON válido; uma cópia de recuperação será preservada.", error);
    progressSaveBlocked = !safeSet(localStorage, RECOVERY_STORAGE_KEY, raw);
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): boolean {
  if (progressSaveBlocked) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
