import { describe, expect, it } from "vitest";
import { applyBackup, buildBackup, parseBackup, type StorageLike } from "./backup";

function backupWithProgress(progress: unknown): string {
  return JSON.stringify({
    app: "minday",
    version: 1,
    data: { "minday.progress": JSON.stringify(progress) },
  });
}

describe("backup do progresso", () => {
  it("continua aceitando dias salvos antes do campo de bônus das missões", () => {
    const result = parseBackup(backupWithProgress({ xp: 0, days: { "2026-04-05": { xp: 0, cycles: 0, tasks: 0 } } }));

    expect(result.ok).toBe(true);
  });

  it("aceita o campo de bônus quando ele é booleano", () => {
    const result = parseBackup(
      backupWithProgress({ xp: 10, days: { "2026-04-05": { xp: 10, cycles: 0, tasks: 0, missionsBonus: true } } })
    );

    expect(result.ok).toBe(true);
  });

  it("recusa um valor inválido no campo do bônus das missões", () => {
    const result = parseBackup(
      backupWithProgress({ xp: 0, days: { "2026-04-05": { xp: 0, cycles: 0, tasks: 0, missionsBonus: "sim" } } })
    );

    expect(result.ok).toBe(false);
  });
});

describe("restauração do backup", () => {
  it("exporta a cópia de recuperação sem bloquear uma restauração", () => {
    const values = new Map<string, string>([
      ["minday.progress", "{json incompleto"],
      ["minday.recovery.progress", "{json incompleto"],
    ]);
    const storage: StorageLike = {
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

    const backup = buildBackup(storage);
    const parsed = parseBackup(backup);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data["minday.recovery.progress"]).toBe("{json incompleto");
      expect(parsed.data["minday.progress"]).toBeUndefined();
    }
  });

  it("mantém os dados anteriores se uma gravação falhar", () => {
    const values = new Map<string, string>([
      ["minday.tasks", JSON.stringify([{ id: "1", title: "Original", status: "Pendente" }])],
      ["outro.site", "não alterar"],
    ]);
    const storage: StorageLike = {
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
        if (key === "minday.profile.name") throw new Error("quota");
        values.set(key, value);
      },
      removeItem(key: string) {
        values.delete(key);
      },
    };

    expect(() =>
      applyBackup(storage, {
        "minday.tasks": "[]",
        "minday.profile.name": "Novo nome",
      })
    ).toThrow("quota");

    expect(storage.getItem("minday.tasks")).toContain("Original");
    expect(storage.getItem("outro.site")).toBe("não alterar");
  });
});
