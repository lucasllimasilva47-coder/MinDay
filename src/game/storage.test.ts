import { describe, expect, it } from "vitest";
import { migrateLegacyData, STORAGE_SCHEMA_KEY, type StorageLike } from "./storage";

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
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
}

describe("migração de armazenamento", () => {
  it("adiciona campos modernos sem apagar progresso existente", () => {
    const storage = memoryStorage({
      "minday.progress": JSON.stringify({ xp: 60, days: { "2026-11-21": { xp: 60, cycles: 1, tasks: 1 } } }),
    });

    expect(migrateLegacyData(storage)).toBe(true);
    expect(JSON.parse(storage.getItem("minday.progress") ?? "{}")).toMatchObject({
      xp: 60,
      awardedTasks: [],
      bestStreak: 0,
    });
    expect(storage.getItem(STORAGE_SCHEMA_KEY)).toBe("1");
  });

  it("não repete uma migração já concluída", () => {
    const storage = memoryStorage({ [STORAGE_SCHEMA_KEY]: "1" });
    expect(migrateLegacyData(storage)).toBe(false);
  });

  it("não altera um progresso que não consegue interpretar", () => {
    const rawProgress = "{progresso incompleto";
    const storage = memoryStorage({ "minday.progress": rawProgress });

    expect(migrateLegacyData(storage)).toBe(false);
    expect(storage.getItem("minday.progress")).toBe(rawProgress);
    expect(storage.getItem(STORAGE_SCHEMA_KEY)).toBeNull();
  });
});
