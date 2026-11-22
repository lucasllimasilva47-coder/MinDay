import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { BookOpen, CalendarDays, ListTodo, Plus } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import type { Task } from "../../game/tasks";
import { loadTaskRecords, saveTaskRecords, TASKS_UPDATED_EVENT } from "../../game/taskStorage";
import { formatDateBR, localDateKey } from "../../game/progress";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input } from "../ui";
import { badgeColor, cryptoRandomId, formatStudyTime, getCategoryColor, isClassItem, type ClassItem } from "./shared";
import { Chip } from "./ScreenControls";
export function AgendaScreen() {
  const { t } = useLanguage();
  const { completeTask, forgetTask } = useGame();
  const todayKey = localDateKey();

  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const raw = localStorage.getItem("minday.classes");
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isClassItem) : [];
    } catch (error) {
      console.error("Não foi possível carregar as aulas salvas.", error);
      return [];
    }
  });

  const [tasks, setTasks] = useState<Task[]>(loadTaskRecords);
  const [storageNotice, setStorageNotice] = useState("");

  useEffect(() => {
    const refreshTasks = () => setTasks(loadTaskRecords());
    window.addEventListener(TASKS_UPDATED_EVENT, refreshTasks);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, refreshTasks);
  }, []);

  const [classNameInput, setClassNameInput] = useState("");
  const [classTimeInput, setClassTimeInput] = useState("");
  const [classWeekdaysInput, setClassWeekdaysInput] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [taskDateInput, setTaskDateInput] = useState("");
  const [taskCategoryInput, setTaskCategoryInput] = useState("Estudo");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "status" | "category">("date");
  const [searchQuery, setSearchQuery] = useState("");

  const weekdays = [
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
    "Dom"
  ];
  const categories = ["Estudo", "Tarefa", "Projeto", "Pessoal"];
  const statuses = ["Pendente", "Em andamento", "Concluída"] as const;

  const toggleWeekday = (day: string) => {
    setClassWeekdaysInput((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const cycleStatus = (id: string) => {
    const current = tasks.find((x) => x.id === id);
    if (!current) return;
    const next: Task["status"] =
      current.status === "Pendente" ? "Em andamento" : current.status === "Em andamento" ? "Concluída" : "Pendente";
    const updated = tasks.map((task) => (task.id === id ? { ...task, status: next } : task));
    try {
      saveTaskRecords(updated);
    } catch (error) {
      console.error("Não foi possível salvar a alteração da tarefa.", error);
      setStorageNotice("A tarefa não foi alterada porque não foi possível salvar os dados.");
      return;
    }
    setStorageNotice("");
    setTasks(updated);
    if (next === "Concluída") completeTask(id);
  };

  const removeTask = (id: string) => {
    const updated = tasks.filter((task) => task.id !== id);
    try {
      saveTaskRecords(updated);
    } catch (error) {
      console.error("Não foi possível remover a tarefa salva.", error);
      setStorageNotice("A tarefa não foi removida porque não foi possível salvar os dados.");
      return;
    }
    forgetTask(id);
    setStorageNotice("");
    setTasks(updated);
  };

  const removeClass = (id: string) => {
    const updated = classes.filter((cls) => cls.id !== id);
    try {
      localStorage.setItem("minday.classes", JSON.stringify(updated));
    } catch (error) {
      console.error("Não foi possível remover a aula salva.", error);
      setStorageNotice("A aula não foi removida porque não foi possível salvar os dados.");
      return;
    }
    setStorageNotice("");
    setClasses(updated);
  };

  const addTask = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = taskInput.trim();
    if (!title) return;
    const updated: Task[] = [
      ...tasks,
      {
        id: cryptoRandomId(),
        title,
        status: "Pendente",
        date: taskDateInput || localDateKey(),
        category: taskCategoryInput || "Estudo"
      },
    ];
    try {
      saveTaskRecords(updated);
    } catch (error) {
      console.error("Não foi possível salvar a nova tarefa.", error);
      setStorageNotice("A tarefa não foi adicionada porque não foi possível salvar os dados.");
      return;
    }
    setTasks(updated);
    setStorageNotice("");
    setTaskInput("");
    setTaskDateInput("");
  };

  const addClass = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = classNameInput.trim();
    if (!name || !classTimeInput) return;
    const updated = [
      ...classes,
      {
        id: cryptoRandomId(),
        name,
        time: classTimeInput,
        weekdays: classWeekdaysInput.length > 0 ? classWeekdaysInput : undefined
      },
    ];
    try {
      localStorage.setItem("minday.classes", JSON.stringify(updated));
    } catch (error) {
      console.error("Não foi possível salvar a nova aula.", error);
      setStorageNotice("A aula não foi adicionada porque não foi possível salvar os dados.");
      return;
    }
    setClasses(updated);
    setStorageNotice("");
    setClassNameInput("");
    setClassTimeInput("");
    setClassWeekdaysInput([]);
  };

  // Filtragem e ordenação de tarefas
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Filtro por status
        if (filterStatus && task.status !== filterStatus) return false;

        // Filtro por categoria
        if (filterCategory && task.category !== filterCategory) return false;

        // Filtro por busca
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        // Ordenação
        if (sortBy === "date") {
          return (a.date || "") > (b.date || "") ? 1 : -1;
        } else if (sortBy === "status") {
          return a.status > b.status ? 1 : -1;
        } else if (sortBy === "category") {
          return (a.category || "") > (b.category || "") ? 1 : -1;
        }
        return 0;
      });
  }, [tasks, filterStatus, filterCategory, searchQuery, sortBy]);

  return (
    <section className="grid min-w-0 gap-6 md:grid-cols-2">
      {storageNotice && (
        <div role="alert" className="rounded-xl bg-rose-400/15 px-4 py-3 text-sm text-rose-200 md:col-span-2">
          {storageNotice}
        </div>
      )}
      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><BookOpen className="h-5 w-5"/> {t("classes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addClass} className="space-y-3">
            <div className="flex gap-2">
              <Input value={classNameInput} onChange={(e: ChangeEvent<HTMLInputElement>) => setClassNameInput(e.target.value)} placeholder={t("enterClassName")} className="min-w-0 bg-white/10 text-white placeholder:text-white/50"/>
              <div className="w-28 shrink-0 sm:w-36">
                <Input type="time" value={classTimeInput} onChange={(e: ChangeEvent<HTMLInputElement>) => setClassTimeInput(e.target.value)} className="bg-white/10 text-white"/>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={`px-3 py-1 text-xs rounded-full border border-emerald-500 transition-colors duration-150 shadow-sm font-semibold ${classWeekdaysInput.includes(day) ? "bg-emerald-500 text-white" : "bg-white/10 text-emerald-500 hover:bg-emerald-100/20"}`}
                >
                  {day}
                </Button>
              ))}
            </div>
            <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg hover:from-emerald-500 hover:to-emerald-700"><Plus className="mr-1 h-4 w-4"/>{t("addClass")}</Button>
          </form>
          <ul className="space-y-3">
            {classes.length === 0 && (
              <EmptyState title="Nenhuma aula cadastrada" description="Adicione sua primeira aula para organizar a semana." />
            )}
            {classes.map((c) => (
              <li key={c.id} className="rounded-xl bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 opacity-80"/> <span className="font-semibold">{c.name}</span></div>
                  <span className="text-sm text-white/70">{c.time}</span>
                </div>
                {c.weekdays && c.weekdays.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.weekdays.map((day) => (
                      <Badge key={day} className="bg-sky-500 text-xs">{day}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() => removeClass(c.id)}
                    className="bg-gradient-to-r from-rose-400 to-rose-600 shadow-md hover:from-rose-500 hover:to-rose-700 text-xs px-3 py-1 rounded-full"
                  >
                    🗑 Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><ListTodo className="h-5 w-5"/> {t("tasks")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addTask} className="space-y-3">
            <Input value={taskInput} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskInput(e.target.value)} placeholder={t("enterTask")} className="bg-white/10 text-white placeholder:text-white/50"/>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                value={taskDateInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskDateInput(e.target.value)}
                className="bg-white/10 text-white placeholder:text-white/50"
              />
              <select
                value={taskCategoryInput}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTaskCategoryInput(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Button className="bg-gradient-to-r from-sky-400 to-sky-600 shadow-lg hover:from-sky-500 hover:to-sky-700"><Plus className="mr-1 h-4 w-4"/>{t("addTask")}</Button>
          </form>

          <div className="space-y-4 rounded-2xl bg-black/20 p-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("status")}</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={filterStatus === null} onClick={() => setFilterStatus(null)}>{t("all")}</Chip>
                {statuses.map((status) => (
                  <Chip
                    key={status}
                    active={filterStatus === status}
                    activeClass={badgeColor(status)}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">{t("category")}</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={filterCategory === null} onClick={() => setFilterCategory(null)}>{t("allCategories")}</Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    active={filterCategory === cat}
                    activeClass={getCategoryColor(cat)}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="bg-white/10 text-white placeholder:text-white/50"
              />
              <select
                value={sortBy}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  if (value === "date" || value === "status" || value === "category") setSortBy(value);
                }}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:w-52 sm:shrink-0"
              >
                <option value="date">{t("sortByDate")}</option>
                <option value="status">{t("sortByStatus")}</option>
                <option value="category">{t("sortByCategory")}</option>
              </select>
            </div>
          </div>

          <ul className="space-y-3">
            {filteredTasks.length === 0 && (
              <li>
                <EmptyState title={t("noTasksFound")} description="Altere os filtros ou adicione uma nova tarefa." />
              </li>
            )}
            {filteredTasks.map((task) => (
              <li key={task.id} className="rounded-xl bg-black/20 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-2">
                    <Badge className={`${badgeColor(task.status)} shrink-0`}>{task.status}</Badge>
                    <span className="min-w-0 break-words font-semibold">{task.title}</span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button className="rounded-full border border-sky-500 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20" onClick={() => cycleStatus(task.id)}>
                      🔄 Próximo
                    </Button>
                    <Button
                      onClick={() => removeTask(task.id)}
                      className="bg-gradient-to-r from-rose-400 to-rose-600 shadow-md hover:from-rose-500 hover:to-rose-700 text-xs px-3 py-1 rounded-full"
                    >
                      🗑 Remover
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-white/70">
                  {task.date && (
                    <div>
                      {formatDateBR(task.date)}
                      {task.status !== "Concluída" && task.date.slice(0, 10) < todayKey && (
                        <span className="ml-2 font-semibold text-rose-300">atrasada</span>
                      )}
                    </div>
                  )}
                  {task.category && <Badge className={getCategoryColor(task.category)}>{task.category}</Badge>}
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {t("timeStudied")}: {formatStudyTime(task.studiedSeconds ?? 0)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
