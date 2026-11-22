import { isRecord } from "./progress";

export type TaskStatus = "Pendente" | "Em andamento" | "Concluída";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  date?: string;
  category?: string;
  studiedSeconds?: number;
};

export function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    value.id.length <= 200 &&
    typeof value.title === "string" &&
    (value.date === undefined || typeof value.date === "string") &&
    (value.category === undefined || typeof value.category === "string") &&
    (value.status === "Pendente" || value.status === "Em andamento" || value.status === "Concluída") &&
    (value.studiedSeconds === undefined ||
      (typeof value.studiedSeconds === "number" &&
        Number.isSafeInteger(value.studiedSeconds) &&
        value.studiedSeconds >= 0))
  );
}

export function addStudyTime(tasks: Task[], taskId: string, seconds: number): Task[] {
  if (!Number.isSafeInteger(seconds) || seconds <= 0) {
    throw new RangeError("O tempo estudado precisa ser um número inteiro positivo de segundos.");
  }

  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, studiedSeconds: (task.studiedSeconds ?? 0) + seconds }
      : task
  );
}
