// Regras do Sono (lógica pura, sem React).
//
// Fontes da faixa recomendada: Academia Americana de Medicina do Sono (AASM),
// também usada pelo CDC. Adolescentes de 13 a 18 anos: 8 a 10 horas por dia.
// Adultos: 7 horas ou mais (aqui usamos 7 a 9 h como faixa de referência).
// É uma referência geral e não substitui avaliação médica.

export type SleepRange = "teen" | "adult";
export type SleepQuality = "Inadequado" | "Adequado" | "Excessivo";

export const SLEEP_RANGES: Record<SleepRange, { min: number; max: number; label: string }> = {
  teen: { min: 8, max: 10, label: "Adolescente (13 a 18 anos)" },
  adult: { min: 7, max: 9, label: "Adulto" },
};

export const MIN_SLEEP_MINUTES = 30; // abaixo disso não é um registro de sono
export const MAX_SLEEP_MINUTES = 16 * 60; // acima disso, provavelmente esqueceram de encerrar

const RANGE_KEY = "minday.sleep.range";

export function isSleepRange(v: unknown): v is SleepRange {
  return v === "teen" || v === "adult";
}

export function loadSleepRange(): SleepRange {
  try {
    const v = localStorage.getItem(RANGE_KEY);
    return isSleepRange(v) ? v : "teen";
  } catch {
    return "teen";
  }
}

export function saveSleepRange(range: SleepRange): boolean {
  try {
    localStorage.setItem(RANGE_KEY, range);
    return true;
  } catch {
    return false;
  }
}

export function minutesBetween(startMs: number, endMs: number): number {
  return Math.floor(Math.max(0, endMs - startMs) / 60000);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

// Usa os minutos exatos (antes só as horas inteiras contavam: 9h59 virava "9h").
export function sleepQuality(minutes: number, range: SleepRange): SleepQuality {
  const { min, max } = SLEEP_RANGES[range];
  const hours = minutes / 60;
  if (hours < min) return "Inadequado";
  if (hours > max) return "Excessivo";
  return "Adequado";
}

export type SleepCheck = { ok: true; minutes: number } | { ok: false; error: string };

// Valida uma noite digitada à mão (campos datetime-local, ex.: "2026-11-20T23:30").
export function checkManualSleep(startValue: string, endValue: string, now: Date = new Date()): SleepCheck {
  if (!startValue || !endValue) return { ok: false, error: "Preencha o início e o fim." };
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return { ok: false, error: "Data ou hora inválida." };
  if (end <= start) return { ok: false, error: "O fim precisa ser depois do início." };
  if (end > now.getTime() + 60_000) return { ok: false, error: "O fim não pode estar no futuro." };
  const minutes = minutesBetween(start, end);
  if (minutes < MIN_SLEEP_MINUTES) return { ok: false, error: "Registro muito curto (menos de 30 minutos)." };
  if (minutes > MAX_SLEEP_MINUTES) return { ok: false, error: "Mais de 16 horas? Confira os horários." };
  return { ok: true, minutes };
}
