import { useEffect, useState } from "react";
import { PencilLine, Settings } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { applyBackup, buildBackup, parseBackup, wipeData } from "../../game/backup";
import { dailyHistory, periodSummary } from "../../game/stats";
import {
  DAILY_GOAL_OPTIONS,
  DAILY_GOAL_XP,
  formatDateBR,
  isDailyGoalXP,
  levelInfo,
  localDateKey,
  type DailyGoalSettings,
  type DailyGoalXP,
  type Progress,
} from "../../game/progress";
import { safeGet, safeSet } from "../../game/storage";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../ui";
import { Mascot } from "../Mascot";
import { AccountSection } from "./AccountSection";

type ProfileScreenProps = {
  progress: Progress;
  streak: number;
  dailyGoalXP: DailyGoalXP;
  dailyGoalSettings: DailyGoalSettings;
  updateDailyGoal: (value: DailyGoalXP, timing: "immediate" | "next-day") => void;
};

export function ProfileScreen({ progress, streak, dailyGoalXP, dailyGoalSettings, updateDailyGoal }: ProfileScreenProps) {
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<string>("");

  const [name, setName] = useState<string>(() => {
    return safeGet(localStorage, "minday.profile.name") || "Usuário";
  });

  const [bio, setBio] = useState<string>(() => {
    return safeGet(localStorage, "minday.profile.bio") || "Estudante focado no MinDay!";
  });

  useEffect(() => {
    if (!safeSet(localStorage, "minday.profile.name", name)) {
      setMessage("Não foi possível salvar o nome do perfil.");
    }
  }, [name]);

  useEffect(() => {
    if (!safeSet(localStorage, "minday.profile.bio", bio)) {
      setMessage("Não foi possível salvar a descrição do perfil.");
    }
  }, [bio]);

  const level = levelInfo(progress.xp);
  const days = Object.values(progress.days);
  const totalCycles = days.reduce((sum, d) => sum + d.cycles, 0);
  const totalTasks = days.reduce((sum, d) => sum + d.tasks, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;
  const weeklyHistory = dailyHistory(progress, new Date(), 7);
  const monthlySummary = periodSummary(progress, new Date(), 30);
  const highestWeeklyXp = Math.max(1, ...weeklyHistory.map((day) => day.xp));

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

      <AccountSection />

      <Card className="bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-xl">📊 Seu histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-white/80">XP nos últimos 7 dias</p>
            <div className="grid h-36 grid-cols-7 items-end gap-2 rounded-2xl bg-black/20 px-3 pb-3 pt-4">
              {weeklyHistory.map((day) => (
                <div key={day.key} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-white/70">{day.xp > 0 ? day.xp : ""}</span>
                  <div
                    className="w-full max-w-8 rounded-t-lg bg-sky-400 transition-[height] duration-500"
                    style={{ height: `${day.xp > 0 ? Math.max(12, (day.xp / highestWeeklyXp) * 88) : 4}%` }}
                    role="img"
                    aria-label={`${day.label}: ${day.xp} XP`}
                  />
                  <span className="text-xs font-semibold text-white/60">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white/80">Resumo dos últimos 30 dias</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-xs text-white/60">XP ganho</div>
                <div className="mt-1 text-xl font-black">{monthlySummary.xp}</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-xs text-white/60">Dias ativos</div>
                <div className="mt-1 text-xl font-black">{monthlySummary.activeDays}</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-xs text-white/60">Focos</div>
                <div className="mt-1 text-xl font-black">{monthlySummary.cycles}</div>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-xs text-white/60">Tarefas</div>
                <div className="mt-1 text-xl font-black">{monthlySummary.tasks}</div>
              </div>
            </div>
          </div>
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
