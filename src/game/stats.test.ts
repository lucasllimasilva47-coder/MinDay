import { describe, expect, it } from "vitest";
import { emptyProgress, localDateKey } from "./progress";
import { dailyHistory, periodSummary } from "./stats";

describe("estatísticas reais", () => {
  it("monta o histórico pelos dias locais sem inventar dados", () => {
    const now = new Date(2026, 10, 21, 12);
    const progress = emptyProgress();
    progress.days[localDateKey(now)] = { xp: 35, cycles: 2, tasks: 1 };

    const history = dailyHistory(progress, now, 7);

    expect(history).toHaveLength(7);
    expect(history[history.length - 1]).toMatchObject({ key: "2026-11-21", xp: 35, cycles: 2, tasks: 1 });
  });

  it("resume somente os dias presentes no período", () => {
    const now = new Date(2026, 10, 21, 12);
    const progress = emptyProgress();
    progress.days["2026-11-20"] = { xp: 20, cycles: 1, tasks: 0 };
    progress.days["2026-11-21"] = { xp: 50, cycles: 1, tasks: 2 };

    expect(periodSummary(progress, now, 7)).toEqual({
      xp: 70,
      cycles: 2,
      tasks: 2,
      activeDays: 2,
    });
  });
});
