import { describe, expect, it, vi } from "vitest";
import { loadTaskRecords, saveTaskRecords, TASKS_STORAGE_KEY, type TaskStorage } from "./taskStorage";

function memoryStorage(initial?: string): TaskStorage & { read(): string | null } {
  let value = initial ?? null;
  return {
    getItem() {
      return value;
    },
    setItem(_key, next) {
      value = next;
    },
    read() {
      return value;
    },
  };
}

describe("armazenamento de tarefas", () => {
  it("filtra itens inválidos sem sobrescrever o dado original", () => {
    const original = JSON.stringify([
      { id: "valid", title: "Revisar", status: "Pendente" },
      { id: "invalid", title: "", status: "Unknown" },
    ]);
    const storage = memoryStorage(original);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      expect(loadTaskRecords(storage)).toEqual([{ id: "valid", title: "Revisar", status: "Pendente" }]);
      expect(storage.read()).toBe(original);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("salva as tarefas sob a chave de armazenamento existente", () => {
    const storage = memoryStorage();
    const tasks = [{ id: "task-1", title: "Estudar", status: "Pendente" as const }];
    saveTaskRecords(tasks, storage);
    expect(storage.read()).toBe(JSON.stringify(tasks));
    expect(TASKS_STORAGE_KEY).toBe("minday.tasks");
  });
});
