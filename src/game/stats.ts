import { localDateKey, type Progress } from "./progress";

export type DailyHistory = {
  key: string;
  label: string;
  xp: number;
  cycles: number;
  tasks: number;
};

export type PeriodSummary = {
  xp: number;
  cycles: number;
  tasks: number;
  activeDays: number;
};

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function dailyHistory(progress: Progress, now: Date = new Date(), days = 7): DailyHistory[] {
  const safeDays = Math.max(1, Math.min(90, Math.floor(days)));
  const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return Array.from({ length: safeDays }, (_, index) => {
    const date = addDays(now, index - safeDays + 1);
    const key = localDateKey(date);
    const stats = progress.days[key];
    return {
      key,
      label: weekdayLabels[date.getDay()],
      xp: stats?.xp ?? 0,
      cycles: stats?.cycles ?? 0,
      tasks: stats?.tasks ?? 0,
    };
  });
}

export function periodSummary(progress: Progress, now: Date = new Date(), days = 30): PeriodSummary {
  const history = dailyHistory(progress, now, days);
  return history.reduce<PeriodSummary>(
    (summary, day) => ({
      xp: summary.xp + day.xp,
      cycles: summary.cycles + day.cycles,
      tasks: summary.tasks + day.tasks,
      activeDays: summary.activeDays + (day.xp > 0 ? 1 : 0),
    }),
    { xp: 0, cycles: 0, tasks: 0, activeDays: 0 }
  );
}
