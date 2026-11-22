import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import {
  MAX_SLEEP_MINUTES,
  MIN_SLEEP_MINUTES,
  SLEEP_RANGES,
  checkManualSleep,
  formatDuration,
  loadSleepRange,
  minutesBetween,
  saveSleepRange,
  sleepQuality,
  type SleepRange,
} from "../../game/sleep";
import { XP_SLEEP } from "../../game/progress";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "../ui";
import { Mascot } from "../Mascot";
import { cryptoRandomId, fmtDate, getSleepQualityColor, loadSleepRecords, qualityKey, type SleepRecord } from "./shared";
import { Chip } from "./ScreenControls";
export function SleepScreen() {
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

  const persistRecords = (next: SleepRecord[]): boolean => {
    try {
      localStorage.setItem("minday.sleep.records", JSON.stringify(next));
      setRecords(next);
      setNotice("");
      return true;
    } catch (error) {
      console.error("Não foi possível salvar os registros de sono.", error);
      setNotice("Não foi possível salvar o registro. Seus dados anteriores foram mantidos.");
      return false;
    }
  };

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
    const updated = records.some((item) => item.id === rec.id)
      ? records.map((item) => (item.id === rec.id ? done : item))
      : [done, ...records].sort((a, b) => b.start.localeCompare(a.start));
    if (!persistRecords(updated)) return false;
    if (quality === "Adequado") completeSleep(rec.id, endMs);
    return true;
  };

  const onRegister = () => {
    if (!ongoingId) {
      const id = cryptoRandomId();
      if (!persistRecords([{ id, start: new Date().toISOString() }, ...records])) return;
      setOngoingId(id);
      return;
    }
    const rec = records.find((x) => x.id === ongoingId);
    if (!rec) return;
    const endMs = Date.now();
    const minutes = minutesBetween(new Date(rec.start).getTime(), endMs);
    if (minutes < MIN_SLEEP_MINUTES || minutes > MAX_SLEEP_MINUTES) {
      // Provavelmente esqueceu de encerrar (ou encerrou sem querer): guarda sem avaliar.
      const updated = records.map((item) =>
        item.id === rec.id
          ? { ...item, end: new Date(endMs).toISOString(), minutes, duration: formatDuration(minutes) }
          : item
      );
      if (!persistRecords(updated)) return;
      setOngoingId(null);
      setNotice(
        minutes > MAX_SLEEP_MINUTES
          ? "Esse registro passou de 16 horas e não foi avaliado. Se você esqueceu de encerrar, remova-o e use “Registrar noite passada”."
          : "Registro muito curto (menos de 30 minutos): não foi avaliado."
      );
      return;
    }
    if (finalize(rec, endMs, minutes)) setOngoingId(null);
  };

  const cancelOngoing = () => {
    if (!ongoingId) return;
    if (!persistRecords(records.filter((item) => item.id !== ongoingId))) return;
    setOngoingId(null);
  };

  const addManual = () => {
    const check = checkManualSleep(manualStart, manualEnd);
    if (!check.ok) {
      setNotice(check.error);
      return;
    }
    const rec: SleepRecord = { id: cryptoRandomId(), start: new Date(manualStart).toISOString() };
    if (!finalize(rec, new Date(manualEnd).getTime(), check.minutes)) return;
    setManualStart("");
    setManualEnd("");
  };

  const removeSleepRecord = (id: string) => {
    if (!persistRecords(records.filter((rec) => rec.id !== id))) return;
    if (id === ongoingId) setOngoingId(null);
  };

  const chooseRange = (next: SleepRange) => {
    if (!saveSleepRange(next)) {
      setNotice("Não foi possível salvar a faixa de sono.");
      return;
    }
    setRange(next);
    setNotice("");
  };

  useEffect(() => {
    try {
      if (ongoingId) localStorage.setItem("minday.sleep.ongoingId", ongoingId);
      else localStorage.removeItem("minday.sleep.ongoingId");
    } catch (error) {
      console.error("Não foi possível salvar o estado do registro de sono.", error);
      setNotice("O registro está ativo, mas não será retomado se a página fechar.");
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
