import { describe, expect, it } from "vitest";
import { freshTimer, reconcileTimer, remainingSeconds } from "./timer";

const durations = {
  Facil: { study: 25 * 60, break: 5 * 60 },
  Medio: { study: 40 * 60, break: 10 * 60 },
  Dificil: { study: 60 * 60, break: 15 * 60 },
};

describe("timer persistente", () => {
  it("calcula o tempo restante pelo instante final", () => {
    const timer = { ...freshTimer(durations, "Facil"), running: true, endAt: 10_000 };
    expect(remainingSeconds(timer, 7_500)).toBe(3);
  });

  it("não continua uma fase que já terminou enquanto a página estava fechada", () => {
    const timer = reconcileTimer(
      { mode: "Facil", isBreak: false, running: true, endAt: 1_000, taskId: null },
      durations,
      2_000
    );
    expect(timer).toEqual(freshTimer(durations, "Facil"));
  });

  it("restaura um timer em andamento sem alterar a hora final", () => {
    const timer = reconcileTimer(
      { mode: "Medio", isBreak: true, running: true, endAt: 20_000, taskId: "task-1" },
      durations,
      10_000
    );
    expect(timer).toMatchObject({
      mode: "Medio",
      isBreak: true,
      running: true,
      endAt: 20_000,
      taskId: "task-1",
    });
  });

  it("descarta horários finais não finitos em dados persistidos", () => {
    const timer = reconcileTimer(
      { mode: "Facil", isBreak: false, running: true, endAt: Number.POSITIVE_INFINITY },
      durations,
      10_000
    );
    expect(timer).toEqual(freshTimer(durations, "Facil"));
  });
});
