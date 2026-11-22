import { isTask, type Task } from "./tasks";

export const TASKS_STORAGE_KEY = "minday.tasks";
export const TASKS_UPDATED_EVENT = "minday.tasks.updated";

export type TaskStorage = Pick<Storage, "getItem" | "setItem">;

export function loadTaskRecords(storage: TaskStorage = localStorage): Task[] {
  try {
    const raw = storage.getItem(TASKS_STORAGE_KEY);
    if (raw === null) return [];

    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.error("Os dados salvos das tarefas não são uma lista.");
      return [];
    }

    const tasks = data.filter(isTask);
    if (tasks.length !== data.length) {
      console.error("Algumas tarefas salvas foram ignoradas porque seus dados são inválidos.");
    }
    return tasks;
  } catch (error) {
    console.error("Não foi possível carregar as tarefas salvas.", error);
    return [];
  }
}

export function saveTaskRecords(tasks: Task[], storage: TaskStorage = localStorage): void {
  storage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}
