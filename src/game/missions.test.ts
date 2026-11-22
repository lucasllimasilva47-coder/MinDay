import { describe, expect, it } from "vitest";
import { dailyMissions, awardDailyMissionsBonus, XP_DAILY_MISSIONS_BONUS } from "./missions";
import { emptyProgress, localDateKey, type DayStats, type Progress } from "./progress";

const date = new Date(2026, 3, 5, 12);

function progressForDay(stats: DayStats): Progress {
  const progress = emptyProgress();
  progress.days[localDateKey(date)] = stats;
  progress.xp = stats.xp;
  return progress;
}

describe("missões diárias", () => {
  it("escolhe três missões únicas e estáveis para a data local", () => {
    const progress = emptyProgress();
    const first = dailyMissions(progress, date);
    const second = dailyMissions(progress, new Date(date.getTime()));

    expect(first).toHaveLength(3);
    expect(new Set(first.map((mission) => mission.id)).size).toBe(3);
    expect(second.map((mission) => mission.id)).toEqual(first.map((mission) => mission.id));
  });

  it("deriva o progresso dos dados do dia, sem guardar contadores de missão", () => {
    const progress = progressForDay({ xp: 20, cycles: 1, tasks: 2, sleep: true });
    const missions = dailyMissions(progress, date);

    for (const mission of missions) {
      const expected = mission.id.startsWith("focus")
        ? 1
        : mission.id.startsWith("task")
          ? 2
          : mission.id === "sleep-ideal"
            ? 1
            : 20;
      expect(mission.progress).toBe(expected);
    }
    expect(progress.days[localDateKey(date)]).not.toHaveProperty("missionProgress");
  });

  it("não paga o bônus antes de concluir as três missões", () => {
    expect(awardDailyMissionsBonus(emptyProgress(), 75, date)).toBeNull();
  });

  it("paga 10 XP uma vez e registra a proteção contra duplicação", () => {
    const progress = progressForDay({
      xp: 40,
      cycles: 10,
      tasks: 10,
      goalBonus: true,
      sleep: true,
    });

    const result = awardDailyMissionsBonus(progress, 75, date);
    if (!result) throw new Error("As três missões completas deveriam pagar o bônus.");

    expect(result.gained).toBe(XP_DAILY_MISSIONS_BONUS);
    expect(result.progress.days[localDateKey(date)]).toMatchObject({
      cycles: 10,
      tasks: 10,
      sleep: true,
      missionsBonus: true,
    });
    expect(progress.days[localDateKey(date)].missionsBonus).toBeUndefined();
    expect(awardDailyMissionsBonus(result.progress, 75, date)).toBeNull();
  });
});
