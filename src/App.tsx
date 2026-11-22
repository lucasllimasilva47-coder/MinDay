import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "./hooks/useLanguage";
import { addStudyTime, isTask, type Task } from "./game/tasks";
import { awardDailyMissionsBonus, dailyMissions, XP_DAILY_MISSIONS_BONUS, type DailyMissionId } from "./game/missions";
import {
  DAILY_GOAL_XP,
  DAILY_GOAL_OPTIONS,
  XP_CYCLE,
  XP_GOAL_BONUS,
  XP_PER_LEVEL,
  XP_SLEEP,
  XP_TASK,
  XP_TASK_DAILY_CAP,
  addXp,
  awardSleep,
  awardTask,
  activatePendingDailyGoal,
  currentStreak,
  dailyGoalForDate,
  formatDateBR,
  immediateDailyGoalChange,
  isDailyGoalXP,
  isRecord,
  levelInfo,
  loadDailyGoalSettings,
  loadProgress,
  localDateKey,
  saveDailyGoalSettings,
  saveProgress,
  scheduleDailyGoalChange,
  todayStats,
  weekDots,
  type DayStats,
  type DailyGoalSettings,
  type DailyGoalXP,
  type Progress,
  type XpResult,
} from "./game/progress";
import type { TranslationKey } from "./i18n/translations";
import {
  MAX_SLEEP_MINUTES,
  MIN_SLEEP_MINUTES,
  SLEEP_RANGES,
  checkManualSleep,
  formatDuration,
  isSleepRange,
  loadSleepRange,
  minutesBetween,
  saveSleepRange,
  sleepQuality,
  type SleepRange,
} from "./game/sleep";
import { applyBackup, buildBackup, parseBackup, wipeData } from "./game/backup";

// =============================
// Componentes Recriados (Substituindo bibliotecas externas)
// =============================

// Ícones Lucide (convertidos para SVG)
const Home = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const CalendarDays = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const AlarmClock = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M5 3L2 6"/><path d="M22 6L19 3"/><path d="M6.38 18.78L4.35 20.81"/><path d="M17.64 18.78L19.67 20.81"/><path d="M12 9v4l2 2"/></svg>;
const Moon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>;
const UserRound = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>;
const BookOpen = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const CheckCircle2 = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
const PencilLine = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M18.4 8.6a2.12 2.12 0 0 1 3 3L16 19l-4 1 1-4Z"/><path d="M2 13v3a2 2 0 0 0 2 2h3l9.5-9.5-4-4L4 10.5V13"/></svg>;
const Play = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const Pause = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>;
const RefreshCw = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9c-7.6 0-1.5 6.4-3 9"/><path d="M3 12a9 9 0 0 0 9 9c7.7 0 1.5-6.4 3-9"/><path d="M17 2v4h4"/><path d="M7 22v-4H3"/></svg>;
const Settings = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.25.43a2 2 0 0 0 0 2.73l.08.15a2 2 0 0 1-1.72 1l-.18.43a2 2 0 0 0 0 2l.18.43a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 2 0l.43-.25a2 2 0 0 1 1-1.73v-.18a2 2 0 0 0 2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const Plus = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const ListTodo = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m13 12 2 2 4-4"/><path d="M13 6h8"/><path d="M13 18h8"/><rect x="3" y="17" width="6" height="6" rx="1"/></svg>;

// Separador estável para o timer (evita glitches de renderização de fonte)
const Colon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size * 1.5} viewBox="0 0 16 24" aria-hidden="true">
    <circle cx="8" cy="7" r="2.5" fill="currentColor" />
    <circle cx="8" cy="17" r="2.5" fill="currentColor" />
  </svg>
);

// Botão Simples com classes do Tailwind
const Button = ({ children, className = "", ...props }: any) => (
  <button className={`flex items-center justify-center rounded-xl px-4 py-2 font-semibold text-white transition-colors duration-200 ease-in-out ${className}`} {...props}>
    {children}
  </button>
);

// Input de texto estilizado
const Input = ({ className = "", ...props }: any) => (
  <input className={`w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500 ${className}`} {...props} />
);

// Componentes Card
const Card = ({ children, className = "", ...props }: any) => (
  <div className={`rounded-3xl p-6 shadow-xl ring-1 ring-white/10 ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }: any) => (
  <div className={`mb-4 flex items-center justify-between ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }: any) => (
  <h2 className={`text-2xl font-bold ${className}`} {...props}>
    {children}
  </h2>
);

const CardContent = ({ children, className = "", ...props }: any) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
);

const Badge = ({ children, className = "", ...props }: any) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${className}`} {...props}>
    {children}
  </span>
);


// =============================
// Lógica e Telas Principais
// =============================
const brand = {
  name: "MinDay",
  green: "#22c55e",
  blue: "#3b82f6",
  red: "#ef4444",
  yellow: "#f59e0b",
  bg: "#0b1b2d",
};

const MODES = {
  Facil: { study: 25 * 60, break: 5 * 60, color: brand.green },
  Medio: { study: 40 * 60, break: 10 * 60, color: brand.yellow },
  Dificil: { study: 60 * 60, break: 15 * 60, color: brand.red },
} as const;

type ModeKey = keyof typeof MODES;

type ClassItem = { id: string; name: string; time: string; weekdays?: string[] };
type SleepRecord = { id: string; start: string; end?: string; duration?: string; minutes?: number; quality?: "Inadequado" | "Adequado" | "Excessivo" };

// Liga o valor guardado nos dados à chave de tradução (cada chave existe em translations.ts)
const qualityKey = {
  Inadequado: "inadequado",
  Adequado: "adequado",
  Excessivo: "excessivo",
} as const;

type Mood = "happy" | "cheer" | "sleepy" | "focus";

function Mascot({ size = 88, mood = "happy" }: { size?: number; mood?: Mood }) {
  // O id do gradiente precisa ser único: há mais de um mascote na mesma página.
  const gid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className="drop-shadow-md" role="img" aria-label="Mascote do MinDay">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffd166"/>
          <stop offset="100%" stopColor="#ffb703"/>
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="56" fill={`url(#${gid})`}/>
      <path d="M34 40c10-12 44-12 60 0-18 2-46 2-60 0z" fill="#8b4513" opacity=".9"/>
      {mood === "sleepy" && (
        <>
          <path d="M39 66h14M75 66h14" stroke="#1f2937" strokeWidth="6" strokeLinecap="round"/>
          <path d="M56 90q8 5 16 0" stroke="#1f2937" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <text x="96" y="30" fontSize="20" fontWeight="700" fill="#93c5fd">z</text>
          <text x="108" y="16" fontSize="14" fontWeight="700" fill="#93c5fd">z</text>
        </>
      )}
      {mood === "cheer" && (
        <>
          <path d="M39 70q7-10 14 0M75 70q7-10 14 0" stroke="#1f2937" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <path d="M44 82c6 22 34 22 40 0z" fill="#1f2937"/>
          <path d="M54 96c6 5 14 5 20 0c-4-4-16-4-20 0z" fill="#fb7185"/>
          <path d="M16 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fde68a"/>
          <path d="M108 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fde68a"/>
        </>
      )}
      {(mood === "happy" || mood === "focus") && (
        <>
          <circle cx="46" cy="66" r="7" fill="#1f2937"/>
          <circle cx="82" cy="66" r="7" fill="#1f2937"/>
          {mood === "focus" && (
            <path d="M36 55l18 5M92 55l-18 5" stroke="#1f2937" strokeWidth="5" strokeLinecap="round"/>
          )}
          <path
            d={mood === "focus" ? "M54 90h20" : "M48 86c10 10 22 10 32 0"}
            stroke="#1f2937" strokeWidth="6" fill="none" strokeLinecap="round"
          />
        </>
      )}
      <circle cx="34" cy="76" r="6" fill="#ffa69e"/>
      <circle cx="94" cy="76" r="6" fill="#ffa69e"/>
    </svg>
  );
}

// =============================
// Jogo: XP, sequência, timer e avisos
// =============================

type Toast = { id: number; text: string; sub?: string; tone: "xp" | "level" | "goal" | "info" };

type TimerState = {
  mode: ModeKey;
  isBreak: boolean;
  running: boolean;
  endAt: number | null; // instante (ms) em que a fase termina; só vale com running = true
  left: number; // segundos que faltam quando está pausado
  taskId: string | null;
};

type GameCtx = {
  progress: Progress;
  today: DayStats;
  streak: number;
  dailyGoalSettings: DailyGoalSettings;
  dailyGoalXP: DailyGoalXP;
  timer: TimerState;
  secondsLeft: number;
  soundOn: boolean;
  toasts: Toast[];
  pendingTask: Pick<Task, "id" | "title"> | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  chooseMode: (mode: ModeKey) => void;
  selectTask: (taskId: string | null) => void;
  forgetTask: (taskId: string) => void;
  dismissPendingTask: () => void;
  confirmPendingTask: () => void;
  updateDailyGoal: (value: DailyGoalXP, timing: "immediate" | "next-day") => void;
  toggleSound: () => void;
  completeTask: (taskId: string) => void;
  completeSleep: (recordId: string, endedAtMs: number) => void;
};

const GameContext = createContext<GameCtx | null>(null);

function useGame(): GameCtx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame precisa ser usado dentro de <GameProvider>");
  return ctx;
}

const TIMER_KEY = "minday.timer";
const SOUND_KEY = "minday.sound";
const TASKS_KEY = "minday.tasks";
const TASKS_UPDATED_EVENT = "minday.tasks.updated";
const ONBOARDING_KEY = "minday.onboarding.completed";
const LEGACY_DATA_KEYS = [
  "minday.progress",
  "minday.tasks",
  "minday.classes",
  "minday.sleep.records",
  "minday.sleep.range",
  "minday.profile.name",
  "minday.profile.bio",
  "minday.dailyGoalXP",
] as const;
const BASE_TITLE = "MinDay - Organize seu dia com diversão";

function phaseSeconds(mode: ModeKey, isBreak: boolean): number {
  return isBreak ? MODES[mode].break : MODES[mode].study;
}

function freshTimer(mode: ModeKey, taskId: string | null = null): TimerState {
  return { mode, isBreak: false, running: false, endAt: null, left: MODES[mode].study, taskId };
}

function isModeKey(v: unknown): v is ModeKey {
  return v === "Facil" || v === "Medio" || v === "Dificil";
}

function loadTimer(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return freshTimer("Facil");
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return freshTimer("Facil");
    const mode = data.mode;
    if (!isModeKey(mode)) return freshTimer("Facil");
    const isBreak = data.isBreak === true;
    const taskId = typeof data.taskId === "string" && data.taskId.length > 0 && data.taskId.length <= 200
      ? data.taskId
      : null;
    const total = phaseSeconds(mode, isBreak);
    if (data.running === true && typeof data.endAt === "number") {
      if (data.endAt > Date.now()) return { mode, isBreak, running: true, endAt: data.endAt, left: total, taskId };
      // A fase terminou com a página fechada. Não dá para saber se houve foco,
      // então não conta ciclo: o timer volta ao começo da fase, parado.
      return { mode, isBreak, running: false, endAt: null, left: total, taskId };
    }
    const left = typeof data.left === "number" ? Math.min(total, Math.max(1, Math.round(data.left))) : total;
    return { mode, isBreak, running: false, endAt: null, left, taskId };
  } catch {
    return freshTimer("Facil");
  }
}

// O tempo restante vem do RELÓGIO (instante final menos agora), não de uma conta
// "menos 1 a cada tick". Assim, se o navegador atrasar o timer numa aba escondida,
// o resultado continua certo.
function remainingSeconds(t: TimerState, nowMs: number): number {
  if (t.running && t.endAt !== null) return Math.max(1, Math.ceil((t.endAt - nowMs) / 1000));
  return t.left;
}

function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

let audioCtx: AudioContext | null = null;

function playTones(freqs: number[]): void {
  try {
    audioCtx = audioCtx ?? new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.16;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.16);
    });
  } catch {
    // sem áudio disponível: o app segue normalmente, só sem som
  }
}

const CELEBRATE = [523, 659, 784, 1047];
const DONE = [659, 880];

function GameProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [dailyGoalSettings, setDailyGoalSettings] = useState<DailyGoalSettings>(loadDailyGoalSettings);
  const [timer, setTimer] = useState<TimerState>(loadTimer);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => remainingSeconds(timer, Date.now()));
  const [soundOn, setSoundOn] = useState<boolean>(loadSound);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingTask, setPendingTask] = useState<Pick<Task, "id" | "title"> | null>(null);

  // Refs guardam o valor mais recente para o relógio, que roda fora da renderização.
  const progressRef = useRef<Progress>(progress);
  const dailyGoalSettingsRef = useRef<DailyGoalSettings>(dailyGoalSettings);
  const dailyGoalRef = useRef<DailyGoalXP>(dailyGoalForDate(dailyGoalSettings));
  const observedDateRef = useRef<string>(localDateKey());
  const timerRef = useRef<TimerState>(timer);
  const soundRef = useRef<boolean>(soundOn);
  const toastSeq = useRef<number>(0);

  const pushToast = useCallback((text: string, tone: Toast["tone"], sub?: string) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, sub, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);

  const updateDailyGoal = useCallback((value: DailyGoalXP, timing: "immediate" | "next-day") => {
    const now = new Date();
    const next =
      timing === "immediate"
        ? immediateDailyGoalChange(value)
        : scheduleDailyGoalChange(dailyGoalSettingsRef.current, value, now);
    saveDailyGoalSettings(next);
    dailyGoalSettingsRef.current = next;
    dailyGoalRef.current = dailyGoalForDate(next, now);
    setDailyGoalSettings(next);
  }, []);

  // Importante: o XP é dado aqui, em eventos, e nunca dentro de uma função
  // passada ao setState (no StrictMode o React a executa duas vezes e o XP dobraria).
  const commitXp = useCallback(
    (result: XpResult, amount: number, label: string) => {
      progressRef.current = result.progress;
      setProgress(result.progress);
      pushToast(`+${amount} XP`, "xp", label);
      if (result.goalReached) pushToast(`Meta do dia batida! +${XP_GOAL_BONUS} XP`, "goal");
      if (result.leveledUp) pushToast(`Você chegou ao nível ${result.level}!`, "level");
    },
    [pushToast]
  );

  const checkDailyMissionBonus = useCallback(() => {
    const result = awardDailyMissionsBonus(progressRef.current, dailyGoalRef.current);
    if (!result) return;
    commitXp(result, XP_DAILY_MISSIONS_BONUS, t("dailyMissionsBonusToast"));
  }, [commitXp, t]);

  const completeTask = useCallback(
    (taskId: string) => {
      const award = awardTask(progressRef.current, taskId, new Date(), dailyGoalRef.current);
      if (!award.ok) {
        if (award.reason === "cap") {
          pushToast("Limite diário de tarefas", "info", `Só ${XP_TASK_DAILY_CAP} tarefas por dia dão XP. Que tal um foco?`);
        }
        return;
      }
      commitXp(award.result, XP_TASK, "Tarefa concluída");
      checkDailyMissionBonus();
      if (soundRef.current) playTones(award.result.goalReached || award.result.leveledUp ? CELEBRATE : DONE);
    },
    [checkDailyMissionBonus, commitXp, pushToast]
  );

  const completeSleep = useCallback(
    (recordId: string, endedAtMs: number) => {
      const award = awardSleep(progressRef.current, recordId, endedAtMs, new Date(), dailyGoalRef.current);
      if (!award.ok) {
        if (award.reason === "cap") pushToast("Sono de hoje já valeu XP", "info", "Só uma noite por dia rende XP");
        return;
      }
      commitXp(award.result, XP_SLEEP, "Boa noite de sono");
      checkDailyMissionBonus();
      if (soundRef.current) playTones(award.result.goalReached || award.result.leveledUp ? CELEBRATE : DONE);
    },
    [checkDailyMissionBonus, commitXp, pushToast]
  );

  const applyTimer = useCallback((next: TimerState) => {
    timerRef.current = next;
    setTimer(next);
    setSecondsLeft(remainingSeconds(next, Date.now()));
  }, []);

  const selectTask = useCallback(
    (taskId: string | null) => {
      const current = timerRef.current;
      if (!current.isBreak && (current.running || current.left !== MODES[current.mode].study)) return;
      if (taskId !== null) {
        const task = loadTaskRecords().find((item) => item.id === taskId && item.status !== "Concluída");
        if (!task) {
          pushToast("Essa tarefa não está mais disponível.", "info");
          return;
        }
      }
      applyTimer({ ...current, taskId });
    },
    [applyTimer, pushToast]
  );

  const forgetTask = useCallback(
    (taskId: string) => {
      const current = timerRef.current;
      if (current.taskId === taskId) applyTimer({ ...current, taskId: null });
      setPendingTask((pending) => (pending?.id === taskId ? null : pending));
    },
    [applyTimer]
  );

  const dismissPendingTask = useCallback(() => setPendingTask(null), []);

  const confirmPendingTask = useCallback(() => {
    if (!pendingTask) return;
    const tasks = loadTaskRecords();
    const task = tasks.find((item) => item.id === pendingTask.id);
    if (!task || task.status === "Concluída") {
      setPendingTask(null);
      return;
    }

    try {
      saveTaskRecords(tasks.map((item) => (item.id === task.id ? { ...item, status: "Concluída" } : item)));
    } catch (error) {
      console.error("Não foi possível salvar a conclusão da tarefa.", error);
      pushToast("Não foi possível salvar a tarefa. Tente novamente.", "info");
      return;
    }

    window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
    setPendingTask(null);
    const current = timerRef.current;
    if (current.taskId === task.id) applyTimer({ ...current, taskId: null });
    completeTask(task.id);
  }, [applyTimer, completeTask, pendingTask, pushToast]);

  const finishPhase = useCallback(
    (t: TimerState) => {
      const now = Date.now();
      if (!t.isBreak) {
        // Terminou um foco: dá XP e começa o descanso sozinho.
        const amount = XP_CYCLE[t.mode];
        const result = addXp(progressRef.current, amount, "cycle", new Date(), dailyGoalRef.current);
        commitXp(result, amount, "Foco concluído");
        checkDailyMissionBonus();
        let nextTaskId = t.taskId;
        if (t.taskId) {
          const tasks = loadTaskRecords();
          const task = tasks.find((item) => item.id === t.taskId);
          if (!task) {
            nextTaskId = null;
          } else {
            try {
              saveTaskRecords(addStudyTime(tasks, task.id, MODES[t.mode].study));
              window.dispatchEvent(new Event(TASKS_UPDATED_EVENT));
              if (task.status === "Concluída") {
                nextTaskId = null;
              } else {
                setPendingTask({ id: task.id, title: task.title });
              }
            } catch (error) {
              console.error("Não foi possível salvar o tempo estudado na tarefa.", error);
              pushToast("O foco foi concluído, mas não foi possível salvar o tempo estudado.", "info");
              nextTaskId = null;
            }
          }
        }
        const breakSec = MODES[t.mode].break;
        pushToast("Hora do descanso", "info", `${breakSec / 60} min para respirar`);
        applyTimer({
          mode: t.mode,
          isBreak: true,
          running: true,
          endAt: now + breakSec * 1000,
          left: breakSec,
          taskId: nextTaskId,
        });
        if (soundRef.current) playTones(result.goalReached || result.leveledUp ? CELEBRATE : DONE);
      } else {
        // Terminou o descanso: para e espera você. Assim ninguém ganha XP
        // com o timer rodando sozinho enquanto está longe.
        pushToast("Descanso acabou", "info", "Quando quiser, comece o próximo foco");
        applyTimer(freshTimer(t.mode, t.taskId));
        if (soundRef.current) playTones([784, 659]);
      }
    },
    [applyTimer, checkDailyMissionBonus, commitXp, pushToast]
  );

  // O relógio: confere 4x por segundo se a fase acabou.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = timerRef.current;
      if (!t.running || t.endAt === null) return;
      const remaining = Math.ceil((t.endAt - Date.now()) / 1000);
      if (remaining > 0) setSecondsLeft(remaining);
      else finishPhase(t);
    }, 250);
    return () => window.clearInterval(id);
  }, [finishPhase]);

  const startTimer = useCallback(() => {
    const t = timerRef.current;
    if (t.running) return;
    applyTimer({ ...t, running: true, endAt: Date.now() + t.left * 1000 });
  }, [applyTimer]);

  const pauseTimer = useCallback(() => {
    const t = timerRef.current;
    if (!t.running) return;
    applyTimer({ ...t, running: false, endAt: null, left: remainingSeconds(t, Date.now()) });
  }, [applyTimer]);

  const resetTimer = useCallback(() => {
    const current = timerRef.current;
    applyTimer(freshTimer(current.mode, current.taskId));
  }, [applyTimer]);
  const chooseMode = useCallback((mode: ModeKey) => {
    applyTimer(freshTimer(mode, timerRef.current.taskId));
  }, [applyTimer]);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // sem permissão para salvar: a escolha vale só nesta visita
    }
  }, []);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => checkDailyMissionBonus(), [checkDailyMissionBonus]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = new Date();
      const dateKey = localDateKey(now);
      if (dateKey === observedDateRef.current) return;
      observedDateRef.current = dateKey;
      const current = dailyGoalSettingsRef.current;
      const next = activatePendingDailyGoal(current, now);
      if (next === current) return;

      dailyGoalSettingsRef.current = next;
      dailyGoalRef.current = next.current;
      setDailyGoalSettings(next);
      try {
        saveDailyGoalSettings(next);
      } catch (error) {
        console.error("A meta começou a valer, mas não foi possível salvar a configuração atualizada.", error);
        pushToast("A meta mudou, mas não foi possível salvar essa alteração.", "info");
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [pushToast]);

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
    } catch {
      // sem permissão para salvar: o timer continua funcionando
    }
  }, [timer]);

  // Mostra o tempo no título da aba (dá para acompanhar de outra aba).
  useEffect(() => {
    if (!timer.running) {
      document.title = BASE_TITLE;
      return;
    }
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    document.title = `${mm}:${ss} · ${timer.isBreak ? "Descanso" : "Foco"} · MinDay`;
  }, [timer.running, timer.isBreak, secondsLeft]);

  const value: GameCtx = {
    progress,
    today: todayStats(progress),
    streak: currentStreak(progress),
    dailyGoalSettings,
    dailyGoalXP: dailyGoalRef.current,
    timer,
    secondsLeft,
    soundOn,
    toasts,
    pendingTask,
    startTimer,
    pauseTimer,
    resetTimer,
    chooseMode,
    selectTask,
    forgetTask,
    dismissPendingTask,
    confirmPendingTask,
    updateDailyGoal,
    toggleSound,
    completeTask,
    completeSleep,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

const TOAST_TONE: Record<Toast["tone"], string> = {
  xp: "bg-emerald-500 text-white",
  level: "bg-amber-400 text-slate-900",
  goal: "bg-sky-500 text-white",
  info: "bg-white/90 text-slate-900",
};

function ToastLayer() {
  const { toasts } = useGame();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2 px-4 sm:bottom-8"
      aria-live="polite"
    >
      {toasts.map((x) => (
        <div key={x.id} className={`animate-pop rounded-2xl px-5 py-3 text-center shadow-xl ${TOAST_TONE[x.tone]}`}>
          <div className="text-lg font-extrabold">{x.text}</div>
          {x.sub && <div className="text-xs font-semibold opacity-90">{x.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}

function AppShell() {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);
  
  const tabs = [
    { key: "home", label: t("home"), icon: Home },
    { key: "agenda", label: t("agenda"), icon: CalendarDays },
    { key: "pomodoro", label: t("pomodoro"), icon: AlarmClock },
    { key: "sono", label: t("sono"), icon: Moon },
    { key: "perfil", label: t("perfil"), icon: UserRound },
  ] as const;

  type TabKey = typeof tabs[number]["key"];

  const [tab, setTab] = useState<TabKey>(() => {
    try {
      const saved = localStorage.getItem("minday.tab");
      if (saved) return saved as TabKey;
    } catch {}
    return "home";
  });
  
  useEffect(() => {
    try { localStorage.setItem("minday.tab", tab); } catch {}
  }, [tab]);

  useEffect(() => {
    if (showOnboarding) return;
    try {
      if (localStorage.getItem(ONBOARDING_KEY) !== "true") {
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
    } catch (error) {
      console.error("Não foi possível salvar que a configuração inicial foi concluída.", error);
    }
  }, [showOnboarding]);

  return (
    <div className="min-h-screen w-full text-white" style={{ background: brand.bg }}>
      {showOnboarding ? (
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      ) : (
        <>
          <Header onNavigate={setTab} current={tab} tabs={tabs} />
          <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-10 sm:pt-10">
            {tab === "home" && <HomeScreen onNavigate={setTab} />}
            {tab === "agenda" && <AgendaScreen />}
            {tab === "pomodoro" && <PomodoroScreen />}
            {tab === "sono" && <SleepScreen />}
            {tab === "perfil" && <ProfileScreen />}
          </main>
          <BottomNav current={tab} onNavigate={setTab} tabs={tabs} />
        </>
      )}
      <ToastLayer />
      <TaskCompletionPrompt />
    </div>
  );
}

function shouldShowOnboarding(): boolean {
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === "true") return false;
    return !LEGACY_DATA_KEYS.some((key) => localStorage.getItem(key) !== null);
  } catch (error) {
    console.error("Não foi possível verificar a configuração inicial.", error);
    return false;
  }
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage();
  const { dailyGoalXP, updateDailyGoal } = useGame();
  const [name, setName] = useState("");
  const [sleepRange, setSleepRange] = useState<SleepRange>(loadSleepRange);
  const [goal, setGoal] = useState<DailyGoalXP>(dailyGoalXP);
  const [error, setError] = useState("");

  const finishSetup = () => {
    try {
      updateDailyGoal(goal, "immediate");
      const trimmedName = name.trim();
      if (trimmedName) localStorage.setItem("minday.profile.name", trimmedName);
      saveSleepRange(sleepRange);
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    } catch (saveError) {
      console.error("Não foi possível salvar a configuração inicial.", saveError);
      setError(t("setupSaveError"));
    }
  };

  const skipSetup = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    } catch (saveError) {
      console.error("Não foi possível salvar que a configuração inicial foi pulada.", saveError);
      setError(t("setupSaveError"));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl bg-white/5 text-white">
        <div className="mb-6 text-center">
          <Mascot size={88} mood="cheer" />
          <h1 className="mt-3 text-2xl font-black">{t("onboardingTitle")}</h1>
          <p className="mt-2 text-sm text-white/70">{t("onboardingIntro")}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="onboarding-name" className="mb-2 block text-sm font-semibold">
              {t("name")} <span className="font-normal text-white/60">({t("optional")})</span>
            </label>
            <Input
              id="onboarding-name"
              value={name}
              onChange={(event: { target: { value: string } }) => setName(event.target.value)}
              maxLength={200}
              placeholder={t("enterName")}
              autoComplete="nickname"
            />
          </div>

          <div>
            <label htmlFor="onboarding-sleep-range" className="mb-2 block text-sm font-semibold">
              {t("sleepRange")}
            </label>
            <select
              id="onboarding-sleep-range"
              value={sleepRange}
              onChange={(event) => {
                if (isSleepRange(event.target.value)) setSleepRange(event.target.value);
              }}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <option value="teen">
                {SLEEP_RANGES.teen.label} · {SLEEP_RANGES.teen.min}–{SLEEP_RANGES.teen.max} h
              </option>
              <option value="adult">
                {SLEEP_RANGES.adult.label} · {SLEEP_RANGES.adult.min}–{SLEEP_RANGES.adult.max} h
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="onboarding-daily-goal" className="mb-2 block text-sm font-semibold">
              {t("dailyGoal")}
            </label>
            <select
              id="onboarding-daily-goal"
              value={goal}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (isDailyGoalXP(value)) setGoal(value);
              }}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {DAILY_GOAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} XP{option === DAILY_GOAL_XP ? ` · ${t("defaultOption")}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-white/60">{t("dailyGoalHelp")}</p>
          </div>

          {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={skipSetup}
              className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {t("skipSetup")}
            </button>
            <button
              type="button"
              onClick={finishSetup}
              className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {t("finishSetup")}
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}

function TaskCompletionPrompt() {
  const { t } = useLanguage();
  const { pendingTask, dismissPendingTask, confirmPendingTask } = useGame();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pendingTask) {
      const activeElement = document.activeElement;
      previouslyFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      dismissButtonRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [pendingTask]);

  useEffect(() => {
    if (!pendingTask) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismissPendingTask();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissPendingTask, pendingTask]);

  if (!pendingTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-completion-title"
        aria-describedby="task-completion-description"
        className="w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl ring-1 ring-white/20"
      >
        <h2 id="task-completion-title" className="text-xl font-bold">
          {t("markTaskCompleteQuestion")}
        </h2>
        <p id="task-completion-description" className="mt-3 text-white/80">
          {pendingTask.title}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={dismissPendingTask}
            className="rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {t("notNow")}
          </button>
          <button
            type="button"
            onClick={confirmPendingTask}
            className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {t("markTaskComplete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ current, onNavigate, tabs }: { current: any; onNavigate: (k: any) => void; tabs: readonly any[] }) {
  const { t } = useLanguage();
  const { progress, streak } = useGame();
  
  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 backdrop-blur-sm" style={{ background: "rgba(11,27,45,0.7)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Mascot size={40} />
          <div>
            <div className="text-lg font-extrabold tracking-wide sm:text-xl">{brand.name}</div>
            <div className="hidden text-xs text-white/70 sm:block">{t("tagline")}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-extrabold sm:mr-4 sm:gap-2 sm:text-sm">
          <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1" title="Dias seguidos estudando">🔥 {streak}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1" title="XP total">⭐ {progress.xp}</span>
        </div>
        <nav className="hidden gap-2 sm:flex">
          {tabs.map((t) => (
            <Button
              key={t.key}
              className={`${current === t.key ? "bg-emerald-500" : "bg-white/10 hover:bg-white/20"} border-0 text-white`}
              onClick={() => onNavigate(t.key)}
            >
              <t.icon className="mr-2 h-4 w-4" /> {t.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function BottomNav({ current, onNavigate, tabs }: { current: any; onNavigate: (k: any) => void; tabs: readonly any[] }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/30 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-5xl grid-cols-5 px-2 py-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-colors duration-200 ${
              current === t.key ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <t.icon className={`h-5 w-5 ${current === t.key ? "" : "opacity-70"}`} />
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function readArray(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadTaskRecords(seedDefaults = false): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw === null) {
      return seedDefaults
        ? [
            { id: cryptoRandomId(), title: "Estudar capítulo 3", status: "Pendente", date: localDateKey(), category: "Estudo" },
            { id: cryptoRandomId(), title: "Exercício de Química", status: "Em andamento", date: localDateKey(), category: "Tarefa" },
          ]
        : [];
    }

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

function saveTaskRecords(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function formatStudyTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes} min` : `${minutes} min`;
}

function isClassItem(v: unknown): v is ClassItem {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.time === "string" &&
    (v.weekdays === undefined || Array.isArray(v.weekdays))
  );
}

function ProgressBar({ value, max, color = "bg-emerald-400" }: { value: number; max: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-white/10"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ emoji, title, value, children }: { emoji: string; title: string; value: string; children?: ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between text-sm font-semibold text-white/70">
        <span>{title}</span>
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {children}
    </div>
  );
}

const DAILY_MISSION_LABELS: Record<DailyMissionId, TranslationKey> = {
  "focus-one": "missionFocusOne",
  "focus-two": "missionFocusTwo",
  "task-one": "missionTaskOne",
  "task-two": "missionTaskTwo",
  "sleep-ideal": "missionSleepIdeal",
  "xp-20": "missionXp20",
};

function HomeScreen({ onNavigate }: { onNavigate: (k: "agenda" | "pomodoro") => void }) {
  const { t } = useLanguage();
  const { progress, today, streak, timer, secondsLeft, startTimer, dailyGoalXP } = useGame();

  const [name] = useState<string>(() => {
    try {
      return localStorage.getItem("minday.profile.name") || "";
    } catch {
      return "";
    }
  });

  // Aulas e tarefas vêm da Agenda (lidas uma vez ao abrir a Home).
  const [agenda] = useState(() => {
    const now = new Date();
    const short = WEEKDAY_SHORT[now.getDay()];
    const key = localDateKey(now);
    const classes = readArray("minday.classes")
      .filter(isClassItem)
      .filter((c) => c.weekdays?.some((d) => d.slice(0, 3) === short))
      .sort((a, b) => a.time.localeCompare(b.time));
    const tasks = readArray("minday.tasks")
      .filter(isTask)
      .filter((task) => task.status !== "Concluída" && !!task.date && task.date.slice(0, 10) <= key)
      .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    return { classes, tasks, key };
  });

  const level = levelInfo(progress.xp);
  const goalReached = today.xp >= dailyGoalXP;
  const hour = new Date().getHours();
  const late = hour >= 22 || hour < 5;
  const focusing = timer.running && !timer.isBreak;
  const mood: Mood = focusing ? "focus" : goalReached ? "cheer" : late ? "sleepy" : "happy";

  const who = name && name !== "Usuário" ? name : "";
  const hi = who ? `Oi, ${who}!` : "Oi!";
  let message = `${hi} Bora fazer um foco rápido?`;
  if (focusing) message = "Foco ligado! Eu fico de olho no tempo.";
  else if (timer.running) message = "Descanse um pouco, você merece.";
  else if (goalReached) message = `Meta de hoje batida${who ? `, ${who}` : ""}! Que orgulho!`;
  else if (late) message = "Já está tarde. Dormir bem também faz parte de estudar!";
  else if (today.xp > 0) message = `Faltam ${dailyGoalXP - today.xp} XP para a meta de hoje.`;
  else if (streak > 0) message = `${hi} Sua sequência está em ${streak} ${streak === 1 ? "dia" : "dias"}. Vamos mantê-la hoje?`;

  const total = phaseSeconds(timer.mode, timer.isBreak);
  let ctaLabel = `Começar foco · ${MODES[timer.mode].study / 60} min`;
  if (timer.running) ctaLabel = `Voltar ao timer · ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  else if (timer.isBreak) ctaLabel = "Retomar descanso";
  else if (secondsLeft < total) ctaLabel = "Continuar foco";

  const startFocus = () => {
    startTimer();
    onNavigate("pomodoro");
  };

  const dots = weekDots(progress);
  const missions = dailyMissions(progress);

  return (
    <section className="space-y-6">
      <div className="flex items-end gap-4">
        <Mascot size={104} mood={mood} />
        <div className="rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 ring-1 ring-white/10">
          <p className="text-lg font-bold leading-snug">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={startFocus}
        className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-white shadow-[0_6px_0_0_#15803d] transition active:translate-y-1 active:shadow-[0_2px_0_0_#15803d]"
      >
        {ctaLabel}
      </button>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard emoji="🔥" title="Sequência" value={`${streak} ${streak === 1 ? "dia" : "dias"}`}>
          <p className="text-xs text-white/60">Melhor: {Math.max(progress.bestStreak, streak)}</p>
        </StatCard>
        <StatCard emoji="⭐" title={`Nível ${level.level}`} value={`${progress.xp} XP`}>
          <ProgressBar value={level.xpInLevel} max={level.xpForNext} color="bg-amber-400" />
          <p className="text-xs text-white/60">{level.xpInLevel}/{level.xpForNext} XP para o próximo nível</p>
        </StatCard>
        <StatCard emoji="🎯" title="Meta de hoje" value={`${Math.min(today.xp, dailyGoalXP)}/${dailyGoalXP} XP`}>
          <ProgressBar value={Math.min(today.xp, dailyGoalXP)} max={dailyGoalXP} color={goalReached ? "bg-emerald-400" : "bg-sky-400"} />
          <p className="text-xs text-white/60">{goalReached ? "Meta batida! ✓" : `+${XP_GOAL_BONUS} XP de bônus ao bater a meta`}</p>
        </StatCard>
      </div>

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-xl">{t("dailyMissionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-white/70" aria-live="polite">
            {today.missionsBonus ? t("dailyMissionsBonusReceived") : t("dailyMissionsHelp")}
          </p>
          <ul className="space-y-4">
            {missions.map((mission) => {
              const label = t(DAILY_MISSION_LABELS[mission.id]);
              const current = Math.min(mission.progress, mission.target);
              return (
                <li key={mission.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{label}</span>
                    <span className="shrink-0 text-sm text-white/70">
                      {mission.completed ? `✓ ${t("missionCompleted")}` : `${current}/${mission.target}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={mission.target}
                    aria-valuenow={current}
                    aria-valuetext={`${current} de ${mission.target}`}
                    className="h-2 overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${(current / mission.target) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
        {dots.map((d) => (
          <div key={d.key} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                d.active ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"
              } ${d.isToday ? "ring-2 ring-sky-400" : ""}`}
            >
              {d.active ? "✓" : ""}
            </div>
            <span className={`text-xs ${d.isToday ? "font-bold text-white" : "text-white/60"}`}>{d.label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><BookOpen className="h-5 w-5"/> Aulas de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agenda.classes.length === 0 && <p className="text-white/70">Sem aulas cadastradas para hoje.</p>}
            {agenda.classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-2">
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-white/70">{c.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><ListTodo className="h-5 w-5"/> Para fazer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agenda.tasks.length === 0 && <p className="text-white/70">Nada atrasado nem para hoje. 🎉</p>}
            {agenda.tasks.slice(0, 4).map((task) => {
              const overdue = (task.date ?? "").slice(0, 10) < agenda.key;
              return (
                <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-4 py-2">
                  <span className="font-semibold">{task.title}</span>
                  <span className={`text-xs font-bold uppercase ${overdue ? "text-rose-300" : "text-amber-300"}`}>
                    {overdue ? "atrasada" : "hoje"}
                  </span>
                </div>
              );
            })}
            {agenda.tasks.length > 4 && <p className="text-sm text-white/60">+{agenda.tasks.length - 4} na Agenda</p>}
            <button type="button" onClick={() => onNavigate("agenda")} className="text-sm font-semibold text-sky-300 hover:underline">
              Abrir Agenda →
            </button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Chip({
  active,
  activeClass = "bg-sky-500",
  onClick,
  children,
}: {
  active: boolean;
  activeClass?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 ${
        active ? activeClass : "bg-white/10 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

function AgendaScreen() {
  const { t } = useLanguage();
  const { completeTask, forgetTask } = useGame();
  const todayKey = localDateKey();
  
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const raw = localStorage.getItem("minday.classes");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      { id: cryptoRandomId(), name: "Matemática", time: "08:00", weekdays: ["Seg", "Qua", "Sex"] },
      { id: cryptoRandomId(), name: "História", time: "10:00", weekdays: ["Ter", "Qui"] },
    ];
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => loadTaskRecords(true));
  
  useEffect(() => {
    try { localStorage.setItem("minday.classes", JSON.stringify(classes)); } catch {}
  }, [classes]);
  
  useEffect(() => {
    try {
      saveTaskRecords(tasks);
    } catch (error) {
      console.error("Não foi possível salvar as tarefas.", error);
    }
  }, [tasks]);

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
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    // O XP é dado aqui, fora do setTasks (uma função de setState pode rodar duas vezes no StrictMode).
    if (next === "Concluída") completeTask(id);
  };

  const removeTask = (id: string) => {
    forgetTask(id);
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const removeClass = (id: string) => {
    setClasses((prev) => prev.filter((cls) => cls.id !== id));
  };

  const addTask = (e: any) => {
    e.preventDefault();
    if (!taskInput) return;
    setTasks((t) => [
      ...t, 
      { 
        id: cryptoRandomId(), 
        title: taskInput, 
        status: "Pendente",
        date: taskDateInput || localDateKey(),
        category: taskCategoryInput || "Estudo"
      }
    ]);
    setTaskInput("");
    setTaskDateInput("");
  };
  
  const addClass = (e: any) => {
    e.preventDefault();
    if (!classNameInput || !classTimeInput) return;
    setClasses((c) => [
      ...c, 
      { 
        id: cryptoRandomId(), 
        name: classNameInput, 
        time: classTimeInput,
        weekdays: classWeekdaysInput.length > 0 ? classWeekdaysInput : undefined
      }
    ]);
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
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white"><BookOpen className="h-5 w-5"/> {t("classes")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addClass} className="space-y-3">
            <div className="flex gap-2">
              <Input value={classNameInput} onChange={(e: any) => setClassNameInput(e.target.value)} placeholder={t("enterClassName")} className="bg-white/10 text-white placeholder:text-white/50"/>
              <div className="w-28 shrink-0 sm:w-36">
                <Input type="time" value={classTimeInput} onChange={(e: any) => setClassTimeInput(e.target.value)} className="bg-white/10 text-white"/>
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
            <Input value={taskInput} onChange={(e: any) => setTaskInput(e.target.value)} placeholder={t("enterTask")} className="bg-white/10 text-white placeholder:text-white/50"/>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input 
                type="date" 
                value={taskDateInput} 
                onChange={(e: any) => setTaskDateInput(e.target.value)} 
                className="bg-white/10 text-white placeholder:text-white/50"
              />
              <select 
                value={taskCategoryInput} 
                onChange={(e: any) => setTaskCategoryInput(e.target.value)}
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
                onChange={(e: any) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="bg-white/10 text-white placeholder:text-white/50"
              />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value as any)}
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
              <li className="rounded-xl bg-black/20 p-4 text-white/70">{t("noTasksFound")}</li>
            )}
            {filteredTasks.map((task) => (
              <li key={task.id} className="rounded-xl bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={`${badgeColor(task.status)} mr-2`}>{task.status}</Badge>
                    <span className="font-semibold">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-white/10 text-white hover:bg-white/20 text-xs px-3 py-1 rounded-full border border-sky-500" onClick={() => cycleStatus(task.id)}>
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

function badgeColor(status: Task["status"]) {
  switch (status) {
    case "Pendente":
      return "bg-yellow-500";
    case "Em andamento":
      return "bg-sky-500";
    case "Concluída":
      return "bg-emerald-500";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Estudo":
      return "bg-purple-500";
    case "Tarefa":
      return "bg-sky-500";
    case "Projeto":
      return "bg-emerald-500";
    case "Pessoal":
      return "bg-rose-500";
    default:
      return "bg-gray-500";
  }
}

function PomodoroScreen() {
  const { t } = useLanguage();
  const {
    timer,
    secondsLeft,
    startTimer,
    pauseTimer,
    resetTimer,
    chooseMode,
    selectTask,
    dailyGoalXP,
    today,
    soundOn,
    toggleSound,
  } = useGame();
  const [tasks, setTasks] = useState<Task[]>(() => loadTaskRecords(true));

  useEffect(() => {
    try {
      saveTaskRecords(tasks);
    } catch (error) {
      console.error("Não foi possível salvar as tarefas.", error);
    }
  }, [tasks]);

  useEffect(() => {
    const refreshTasks = () => setTasks(loadTaskRecords());
    window.addEventListener(TASKS_UPDATED_EVENT, refreshTasks);
    return () => window.removeEventListener(TASKS_UPDATED_EVENT, refreshTasks);
  }, []);

  const total = phaseSeconds(timer.mode, timer.isBreak);
  const taskSelectionDisabled = !timer.isBreak && (timer.running || secondsLeft < total);
  const fraction = Math.min(1, Math.max(0, secondsLeft / total));
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const ringColor = timer.isBreak ? "#38bdf8" : MODES[timer.mode].color;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">{t("pomodoro")}</CardTitle>
          <button
            type="button"
            onClick={toggleSound}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
          >
            {soundOn ? "🔔 Som ligado" : "🔕 Som desligado"}
          </button>
        </CardHeader>
        <CardContent className="space-y-6 text-white">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODES) as ModeKey[]).map((k) => {
              const studyM = Math.round(MODES[k].study / 60);
              const breakM = Math.round(MODES[k].break / 60);
              const label = k === "Facil" ? t("easy") : k === "Medio" ? t("medium") : t("hard");
              return (
                <Button
                  key={k}
                  onClick={() => chooseMode(k)}
                  disabled={timer.running}
                  className={`border-0 disabled:cursor-not-allowed ${k === timer.mode ? "" : "opacity-70"}`}
                  style={{ background: MODES[k].color }}
                >
                  {label} {studyM}/{breakM} min
                </Button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="pomodoro-task" className="block text-sm font-semibold text-white/90">
              {t("taskForFocus")}
            </label>
            <select
              id="pomodoro-task"
              value={timer.taskId ?? ""}
              onChange={(event) => selectTask(event.target.value || null)}
              disabled={taskSelectionDisabled}
              className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{t("noTaskSelected")}</option>
              {tasks
                .filter((task) => task.status !== "Concluída")
                .map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
            </select>
            {tasks.every((task) => task.status === "Concluída") && (
              <p className="text-sm text-white/60">{t("noTasksForFocus")}</p>
            )}
          </div>

          <div className="rounded-3xl bg-black/20 p-6 text-center">
            <div className="relative mx-auto h-52 w-52 sm:h-56 sm:w-56">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction)}
                  style={{ transition: "stroke-dashoffset 0.4s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs uppercase tracking-widest text-white/70">{timer.isBreak ? t("break") : t("study")}</div>
                <div className="mt-1 flex items-center gap-2 text-5xl font-black">
                  <span>{mm}</span>
                  <Colon size={14} />
                  <span>{ss}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={timer.running ? pauseTimer : startTimer}
                className="flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#15803d] transition active:translate-y-1 active:shadow-[0_1px_0_0_#15803d]"
              >
                {timer.running ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                {timer.running ? t("pause") : secondsLeft < total ? "Continuar" : t("start")}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="flex items-center justify-center rounded-2xl bg-rose-500 px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#be123c] transition active:translate-y-1 active:shadow-[0_1px_0_0_#be123c]"
              >
                <RefreshCw className="mr-2 h-4 w-4"/>{t("reset")}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5"/> {t("cyclesCompleted")} hoje: <span className="font-bold text-white">{today.cycles}</span>
            </div>
            <div className="text-sm text-white/60">Concluir este foco rende +{XP_CYCLE[timer.mode]} XP</div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{t("quickTip")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-white/80">
            <p>{t("pomodoroTip")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Como ganhar XP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <p>Foco concluído: +{XP_CYCLE.Facil} (fácil), +{XP_CYCLE.Medio} (médio) ou +{XP_CYCLE.Dificil} (difícil) XP.</p>
            <p>Tarefa concluída na Agenda: +{XP_TASK} XP (até {XP_TASK_DAILY_CAP} por dia).</p>
            <p>Bateu {dailyGoalXP} XP no dia: bônus de +{XP_GOAL_BONUS} XP.</p>
            <p>A cada {XP_PER_LEVEL} XP você sobe de nível.</p>
            <p className="text-white/60">Se fechar a página no meio de um foco, o ciclo não conta.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function isSleepRecord(v: unknown): v is SleepRecord {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.start === "string" &&
    (v.end === undefined || typeof v.end === "string") &&
    (v.duration === undefined || typeof v.duration === "string") &&
    (v.minutes === undefined || typeof v.minutes === "number") &&
    (v.quality === undefined || v.quality === "Inadequado" || v.quality === "Adequado" || v.quality === "Excessivo")
  );
}

function loadSleepRecords(): SleepRecord[] {
  return readArray("minday.sleep.records").filter(isSleepRecord);
}

function SleepScreen() {
  const { t } = useLanguage();
  const { completeSleep } = useGame();

  const [records, setRecords] = useState<SleepRecord[]>(loadSleepRecords);
  const [ongoingId, setOngoingId] = useState<string | null>(() => {
    try {
      const id = localStorage.getItem("minday.sleep.ongoingId");
      // só vale se o registro ainda existir e estiver aberto
      return id && loadSleepRecords().some((r) => r.id === id && !r.end) ? id : null;
    } catch {
      return null;
    }
  });
  const [range, setRange] = useState<SleepRange>(loadSleepRange);
  const [notice, setNotice] = useState<string>("");
  const [manualStart, setManualStart] = useState<string>("");
  const [manualEnd, setManualEnd] = useState<string>("");

  const ref = SLEEP_RANGES[range];

  // Fecha um registro: calcula a qualidade e, se a noite foi ideal, dá XP.
  const finalize = (rec: SleepRecord, endMs: number, minutes: number) => {
    const quality = sleepQuality(minutes, range);
    const done: SleepRecord = {
      ...rec,
      end: new Date(endMs).toISOString(),
      minutes,
      duration: formatDuration(minutes),
      quality,
    };
    setRecords((r) => r.map((x) => (x.id === rec.id ? done : x)));
    if (quality === "Adequado") completeSleep(rec.id, endMs);
  };

  const onRegister = () => {
    if (!ongoingId) {
      const id = cryptoRandomId();
      setRecords((r) => [{ id, start: new Date().toISOString() }, ...r]);
      setOngoingId(id);
      setNotice("");
      return;
    }
    const rec = records.find((x) => x.id === ongoingId);
    setOngoingId(null);
    if (!rec) return;
    const endMs = Date.now();
    const minutes = minutesBetween(new Date(rec.start).getTime(), endMs);
    if (minutes < MIN_SLEEP_MINUTES || minutes > MAX_SLEEP_MINUTES) {
      // Provavelmente esqueceu de encerrar (ou encerrou sem querer): guarda sem avaliar.
      setRecords((r) =>
        r.map((x) =>
          x.id === rec.id ? { ...x, end: new Date(endMs).toISOString(), minutes, duration: formatDuration(minutes) } : x
        )
      );
      setNotice(
        minutes > MAX_SLEEP_MINUTES
          ? "Esse registro passou de 16 horas e não foi avaliado. Se você esqueceu de encerrar, remova-o e use “Registrar noite passada”."
          : "Registro muito curto (menos de 30 minutos): não foi avaliado."
      );
      return;
    }
    setNotice("");
    finalize(rec, endMs, minutes);
  };

  const cancelOngoing = () => {
    if (!ongoingId) return;
    setRecords((r) => r.filter((x) => x.id !== ongoingId));
    setOngoingId(null);
    setNotice("");
  };

  const addManual = () => {
    const check = checkManualSleep(manualStart, manualEnd);
    if (!check.ok) {
      setNotice(check.error);
      return;
    }
    const rec: SleepRecord = { id: cryptoRandomId(), start: new Date(manualStart).toISOString() };
    setRecords((r) => [{ ...rec }, ...r].sort((a, b) => b.start.localeCompare(a.start)));
    finalize(rec, new Date(manualEnd).getTime(), check.minutes);
    setManualStart("");
    setManualEnd("");
    setNotice("");
  };

  const removeSleepRecord = (id: string) => {
    setRecords((r) => r.filter((rec) => rec.id !== id));
    if (id === ongoingId) setOngoingId(null);
  };

  const chooseRange = (next: SleepRange) => {
    setRange(next);
    saveSleepRange(next);
  };

  useEffect(() => {
    try {
      localStorage.setItem("minday.sleep.records", JSON.stringify(records));
    } catch {
      // sem permissão para salvar: os registros valem só nesta visita
    }
  }, [records]);

  useEffect(() => {
    try {
      if (ongoingId) localStorage.setItem("minday.sleep.ongoingId", ongoingId);
      else localStorage.removeItem("minday.sleep.ongoingId");
    } catch {
      // sem permissão para salvar: o registro em andamento vale só nesta visita
    }
  }, [ongoingId]);

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5"/> {t("sleep")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">Sua faixa de referência</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={range === "teen"} onClick={() => chooseRange("teen")}>{SLEEP_RANGES.teen.label}</Chip>
              <Chip active={range === "adult"} onClick={() => chooseRange("adult")}>{SLEEP_RANGES.adult.label}</Chip>
            </div>
          </div>

          <div className="rounded-3xl bg-black/20 p-6 text-center">
            <div className="flex justify-center"><Mascot size={72} mood={ongoingId ? "sleepy" : "happy"} /></div>
            <div className="mt-3 text-lg">{ongoingId ? t("recordingInProgress") : t("readyToRecord")}</div>
            <button
              type="button"
              onClick={onRegister}
              className="mt-4 rounded-2xl bg-sky-500 px-6 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_5px_0_0_#0369a1] transition active:translate-y-1 active:shadow-[0_1px_0_0_#0369a1]"
            >
              {ongoingId ? t("endRecording") : t("recordSleep")}
            </button>
            {ongoingId && (
              <div className="mt-3">
                <button type="button" onClick={cancelOngoing} className="text-sm font-semibold text-white/70 hover:underline">
                  Cancelar este registro
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl bg-black/20 p-4">
            <h3 className="text-lg font-bold">Registrar noite passada</h3>
            <p className="text-sm text-white/70">Esqueceu de apertar o botão? Informe os horários.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/80">Dormi às</label>
                <Input type="datetime-local" value={manualStart} onChange={(e: { target: { value: string } }) => setManualStart(e.target.value)} className="bg-white/10 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80">Acordei às</label>
                <Input type="datetime-local" value={manualEnd} onChange={(e: { target: { value: string } }) => setManualEnd(e.target.value)} className="bg-white/10 text-white" />
              </div>
            </div>
            <Button type="button" onClick={addManual} className="bg-sky-500 hover:bg-sky-600">Adicionar noite</Button>
          </div>

          {notice && (
            <div role="status" className="rounded-xl bg-amber-400/15 px-4 py-3 text-sm text-amber-200">{notice}</div>
          )}

          <div>
            <h3 className="mb-3 text-lg font-bold">{t("records")}</h3>
            <ul className="space-y-3">
              {records.length === 0 && (
                <li className="rounded-xl bg-black/20 p-4 text-white/70">{t("noRecordsYet")}</li>
              )}
              {records.map((r) => (
                <li key={r.id} className="space-y-3 rounded-xl bg-black/20 p-4">
                  <div className="grid gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-white/70">{t("startTime")}</div>
                      <div className="font-semibold">{fmtDate(r.start)}</div>
                    </div>
                    <div>
                      <div className="text-white/70">{t("endTime")}</div>
                      <div className="font-semibold">{r.end ? fmtDate(r.end) : "—"}</div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-white/70">{t("duration")}</div>
                      <div className="font-semibold">{r.duration ?? (r.id === ongoingId ? t("recording") : "—")}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {r.quality ? (
                      <Badge className={getSleepQualityColor(r.quality)}>{t(qualityKey[r.quality])}</Badge>
                    ) : (
                      <span className="text-xs text-white/60">{r.id === ongoingId ? t("recording") : "Sem avaliação"}</span>
                    )}
                    <Button
                      onClick={() => removeSleepRecord(r.id)}
                      className="rounded-full bg-gradient-to-r from-rose-400 to-rose-600 px-3 py-1 text-xs shadow-md hover:from-rose-500 hover:to-rose-700"
                    >
                      🗑 Remover
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">{t("sleepQuality")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-white/80">
          <p>Faixa de referência para <span className="font-bold text-white">{ref.label}</span>:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">{t("inadequado")}</Badge>
              <span>menos de {ref.min} {t("hours")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500">{t("adequado")}</Badge>
              <span>{ref.min} a {ref.max} {t("hours")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">{t("excessivo")}</Badge>
              <span>mais de {ref.max} {t("hours")}</span>
            </div>
          </div>
          <p className="text-sm">
            Uma noite dentro da faixa ideal rende <span className="font-bold text-white">+{XP_SLEEP} XP</span> (1 vez por dia, para noites encerradas nas últimas 36 horas).
          </p>
          <p className="text-xs text-white/60">
            Referência: Academia Americana de Medicina do Sono (AASM), também usada pelo CDC. Adolescentes de 13 a 18 anos: 8 a 10 h por dia.
            Adultos: 7 h ou mais (aqui usamos 7 a 9 h como referência). É uma orientação geral e não substitui avaliação médica: se você dorme
            bastante e continua muito cansado, converse com um médico.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function ProfileScreen() {
  const { t } = useLanguage();
  const { progress, streak, dailyGoalXP, dailyGoalSettings, updateDailyGoal } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [name, setName] = useState<string>(() => {
    try {
      return localStorage.getItem("minday.profile.name") || "Usuário";
    } catch {
      return "Usuário";
    }
  });

  const [bio, setBio] = useState<string>(() => {
    try {
      return localStorage.getItem("minday.profile.bio") || "Estudante focado no MinDay!";
    } catch {
      return "Estudante focado no MinDay!";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("minday.profile.name", name);
    } catch {
      // sem permissão para salvar: o nome vale só nesta visita
    }
  }, [name]);

  useEffect(() => {
    try {
      localStorage.setItem("minday.profile.bio", bio);
    } catch {
      // sem permissão para salvar: o texto vale só nesta visita
    }
  }, [bio]);

  const level = levelInfo(progress.xp);
  const days = Object.values(progress.days);
  const totalCycles = days.reduce((sum, d) => sum + d.cycles, 0);
  const totalTasks = days.reduce((sum, d) => sum + d.tasks, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;

  const onExport = () => {
    try {
      const blob = new Blob([buildBackup(localStorage)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `minday-backup-${localDateKey()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Backup baixado. Guarde o arquivo em um lugar seguro.");
    } catch {
      setMessage("Não foi possível gerar o backup neste navegador.");
    }
  };

  const onImport = async (e: { target: HTMLInputElement }) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // permite escolher o mesmo arquivo outra vez
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      if (!parsed.ok) {
        setMessage(parsed.error);
        return;
      }
      const sure = window.confirm(
        "Importar este backup? Isso SUBSTITUI os dados atuais deste navegador (tarefas, aulas, sono, XP)."
      );
      if (!sure) return;
      applyBackup(localStorage, parsed.data);
      window.location.reload();
    } catch {
      setMessage("Não foi possível ler esse arquivo.");
    }
  };

  const onWipe = () => {
    const sure = window.confirm(
      "Apagar TODOS os dados do MinDay neste navegador (tarefas, aulas, sono, XP)? Não dá para desfazer. Dica: exporte um backup antes."
    );
    if (!sure) return;
    wipeData(localStorage);
    window.location.reload();
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Mascot size={80} mood={streak > 0 ? "cheer" : "happy"} />
        <div>
          <div className="text-3xl font-black">{name}</div>
          <div className="text-white/70">{bio}</div>
        </div>
      </div>

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">⭐ Seu progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">Nível</div>
              <div className="text-2xl font-black">{level.level}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">XP total</div>
              <div className="text-2xl font-black">{progress.xp}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">Sequência</div>
              <div className="text-2xl font-black">🔥 {streak}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">Melhor sequência</div>
              <div className="text-2xl font-black">{Math.max(progress.bestStreak, streak)}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">Focos concluídos</div>
              <div className="text-2xl font-black">{totalCycles}</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-xs text-white/60">Tarefas com XP</div>
              <div className="text-2xl font-black">{totalTasks}</div>
            </div>
          </div>
          <p className="text-xs text-white/60">{activeDays} {activeDays === 1 ? "dia ativo" : "dias ativos"} no total.</p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PencilLine className="h-5 w-5"/> {t("editProfile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm text-white/80">{t("name")}</label>
          <Input value={name} onChange={(e: { target: { value: string } }) => setName(e.target.value)} className="bg-white/10 text-white placeholder:text-white/50"/>
          <label className="mt-3 block text-sm text-white/80">{t("about")}</label>
          <Input value={bio} onChange={(e: { target: { value: string } }) => setBio(e.target.value)} className="bg-white/10 text-white placeholder:text-white/50"/>
          <div className="pt-2 text-white/70">{t("profileTip")}</div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setShowSettings(!showSettings)}>
          <Settings className="mr-2 h-4 w-4"/> {t("settings")}
        </Button>
      </div>

      {message && (
        <div role="status" className="rounded-xl bg-sky-400/15 px-4 py-3 text-sm text-sky-200">{message}</div>
      )}

      {showSettings && (
        <Card className="bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> {t("settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="profile-daily-goal" className="block text-sm font-semibold">
                {t("dailyGoal")}
              </label>
              <p className="text-sm text-white/70">
                {t("goalActiveToday")} {dailyGoalXP} XP
              </p>
              <select
                id="profile-daily-goal"
                value={dailyGoalSettings.pending?.value ?? dailyGoalXP}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!isDailyGoalXP(value)) {
                    setMessage(t("goalInvalid"));
                    return;
                  }
                  try {
                    updateDailyGoal(value, "next-day");
                    setMessage(value === dailyGoalXP ? t("goalUsingCurrent") : t("goalScheduled"));
                  } catch (error) {
                    console.error("Não foi possível salvar a nova meta diária.", error);
                    setMessage(t("goalSaveError"));
                  }
                }}
                className="w-full rounded-xl border border-white/20 bg-slate-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {DAILY_GOAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} XP{option === DAILY_GOAL_XP ? ` · ${t("defaultOption")}` : ""}
                  </option>
                ))}
              </select>
              {dailyGoalSettings.pending ? (
                <p className="text-xs text-white/60">
                  {t("goalStartsTomorrow")} {dailyGoalSettings.pending.value} XP (
                  {formatDateBR(dailyGoalSettings.pending.startsOn)}).
                </p>
              ) : (
                <p className="text-xs text-white/60">{t("goalChangeHelp")}</p>
              )}
            </div>

            <div>
              <div className="text-sm text-white/80">Idioma: <span className="font-bold">Português</span></div>
              <div className="mt-1 text-xs text-white/60">O idioma do aplicativo está fixo em português.</div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold">Backup dos seus dados</h3>
              <p className="text-sm text-white/70">
                Seus dados ficam só neste navegador. Exporte um arquivo para guardar uma cópia ou levar para outro aparelho.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onExport} className="bg-sky-500 hover:bg-sky-600">Exportar backup</Button>
                <label className="flex cursor-pointer items-center justify-center rounded-xl bg-white/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/20">
                  Importar backup
                  <input type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-rose-400/30 p-4">
              <h3 className="font-bold text-rose-200">Zona de perigo</h3>
              <p className="text-sm text-white/70">Apaga tarefas, aulas, sono, XP e sequência deste navegador. Não dá para desfazer.</p>
              <Button type="button" onClick={onWipe} className="bg-rose-500 hover:bg-rose-600">Apagar todos os meus dados</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// ===== util =====
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSleepQualityColor(quality: string): string {
  switch (quality) {
    case "Inadequado":
      return "bg-yellow-500";
    case "Adequado":
      return "bg-emerald-500";
    case "Excessivo":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
}

function cryptoRandomId() {
  // gera um id simples e único
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}