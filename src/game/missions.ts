import { addXp, localDateKey, todayStats, type DailyGoalXP, type Progress, type XpResult } from "./progress";

export const XP_DAILY_MISSIONS_BONUS = 10;

export type DailyMissionId = "focus-one" | "focus-two" | "task-one" | "task-two" | "sleep-ideal" | "xp-20";

export type DailyMission = {
  id: DailyMissionId;
  target: number;
  progress: number;
  completed: boolean;
};

type MissionDefinition = Pick<DailyMission, "id" | "target"> & {
  progress: (stats: ReturnType<typeof todayStats>) => number;
};

const MISSION_POOL: MissionDefinition[] = [
  { id: "focus-one", target: 1, progress: (stats) => stats.cycles },
  { id: "focus-two", target: 2, progress: (stats) => stats.cycles },
  { id: "task-one", target: 1, progress: (stats) => stats.tasks },
  { id: "task-two", target: 2, progress: (stats) => stats.tasks },
  { id: "sleep-ideal", target: 1, progress: (stats) => Number(stats.sleep === true) },
  { id: "xp-20", target: 20, progress: (stats) => stats.xp },
];

function dateSeed(dateKey: string): number {
  let seed = 2166136261;
  for (let index = 0; index < dateKey.length; index += 1) {
    seed = Math.imul(seed ^ dateKey.charCodeAt(index), 16777619);
  }
  return seed >>> 0;
}

function nextRandom(state: { value: number }): number {
  let value = state.value;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.value = value >>> 0;
  return state.value / 0x1_0000_0000;
}

export function dailyMissions(progress: Progress, now: Date = new Date()): DailyMission[] {
  const dateKey = localDateKey(now);
  const stats = todayStats(progress, now);
  const randomState = { value: dateSeed(dateKey) };
  const shuffled = [...MISSION_POOL];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom(randomState) * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, 3).map((definition) => {
    const current = definition.progress(stats);
    return {
      id: definition.id,
      target: definition.target,
      progress: current,
      completed: current >= definition.target,
    };
  });
}

export function awardDailyMissionsBonus(
  progress: Progress,
  dailyGoalXP: DailyGoalXP,
  now: Date = new Date()
): XpResult | null {
  const dateKey = localDateKey(now);
  if (todayStats(progress, now).missionsBonus) return null;
  if (!dailyMissions(progress, now).every((mission) => mission.completed)) return null;

  const result = addXp(progress, XP_DAILY_MISSIONS_BONUS, "mission", now, dailyGoalXP);
  const day = result.progress.days[dateKey];
  return {
    ...result,
    progress: {
      ...result.progress,
      days: {
        ...result.progress.days,
        [dateKey]: { ...day, missionsBonus: true },
      },
    },
  };
}
