import { describe, expect, it, vi } from "vitest";
import {
  awardSleep,
  awardTask,
  emptyProgress,
  loadProgress,
  localDateKey,
  saveProgress,
  XP_SLEEP,
  XP_TASK,
  XP_TASK_DAILY_CAP,
} from "./progress";

const now = new Date(2026, 10, 21, 12);

describe("recompensas do progresso", () => {
  it("concede XP de tarefa uma única vez e respeita o limite diário", () => {
    let progress = emptyProgress();

    for (let index = 0; index < XP_TASK_DAILY_CAP + 1; index += 1) {
      const award = awardTask(progress, `task-${index}`, now, 75);
      if (award.ok) progress = award.result.progress;
    }

    expect(progress.awardedTasks).toHaveLength(XP_TASK_DAILY_CAP);
    expect(progress.days[localDateKey(now)].tasks).toBe(XP_TASK_DAILY_CAP);
    expect(progress.xp).toBe(XP_TASK_DAILY_CAP * XP_TASK);

    const duplicate = awardTask(progress, "task-0", now, 75);
    expect(duplicate).toEqual({ ok: false, reason: "already" });
  });

  it("concede XP de sono uma vez por registro recente e não paga registros antigos", () => {
    const endedAtMs = now.getTime() - 60 * 60 * 1000;
    const award = awardSleep(emptyProgress(), "night-1", endedAtMs, now, 75);
    if (!award.ok) throw new Error("A noite recente deveria ser recompensada.");

    expect(award.result.progress.xp).toBe(XP_SLEEP);
    expect(award.result.progress.days[localDateKey(now)].sleep).toBe(true);
    expect(awardSleep(award.result.progress, "night-1", endedAtMs, now, 75)).toEqual({
      ok: false,
      reason: "already",
    });

    const old = awardSleep(emptyProgress(), "night-old", now.getTime() - 37 * 60 * 60 * 1000, now, 75);
    expect(old).toEqual({ ok: false, reason: "old" });
  });

  it("preserva progresso inválido para recuperação antes de gravar um novo estado", () => {
    const values = new Map<string, string>([["minday.progress", "{dado incompleto"]]);
    const storage = {
      get length() {
        return values.size;
      },
      key(index: number) {
        return [...values.keys()][index] ?? null;
      },
      getItem(key: string) {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        values.set(key, value);
      },
      removeItem(key: string) {
        values.delete(key);
      },
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("localStorage", storage);
    try {
      expect(loadProgress()).toEqual(emptyProgress());
      expect(storage.getItem("minday.recovery.progress")).toBe("{dado incompleto");
      expect(saveProgress(emptyProgress())).toBe(true);
      expect(storage.getItem("minday.progress")).toContain('"xp":0');
    } finally {
      vi.unstubAllGlobals();
      consoleError.mockRestore();
    }
  });
});
