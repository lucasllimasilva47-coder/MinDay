import { describe, expect, it } from "vitest";
import { parseBackup } from "./backup";

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
