import { useEffect, useState } from "react";
import { AlarmClock, CalendarDays, Home, Moon, UserRound } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import { useGame } from "../../game/context";
import { safeGet, safeSet } from "../../game/storage";
import { brand } from "../brand";
import { ONBOARDING_KEY } from "../screens/shared";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { AgendaScreen } from "../screens/AgendaScreen";
import { PomodoroScreen } from "../screens/PomodoroScreen";
import { SleepScreen } from "../screens/SleepScreen";
import { ProfileScreen as ProfileScreenView } from "../screens/ProfileScreen";
import { BottomNav, Header } from "./Navigation";
import { TaskCompletionPrompt, ToastLayer } from "./GameOverlays";
import type { TabKey } from "./Navigation";

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
export function AppShell() {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);

  const tabs = [
    { key: "home", label: t("home"), icon: Home },
    { key: "agenda", label: t("agenda"), icon: CalendarDays },
    { key: "pomodoro", label: t("pomodoro"), icon: AlarmClock },
    { key: "sono", label: t("sono"), icon: Moon },
    { key: "perfil", label: t("perfil"), icon: UserRound },
  ] as const;

  const [tab, setTab] = useState<TabKey>(() => {
    const saved = safeGet(localStorage, "minday.tab");
    if (saved === "home" || saved === "agenda" || saved === "pomodoro" || saved === "sono" || saved === "perfil") {
      return saved;
    }
    return "home";
  });

  useEffect(() => {
    safeSet(localStorage, "minday.tab", tab);
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
          <main className="mx-auto w-full max-w-5xl min-w-0 px-4 pb-28 pt-6 sm:pt-10 lg:pb-10">
            {tab === "home" && <HomeScreen onNavigate={setTab} />}
            {tab === "agenda" && <AgendaScreen />}
            {tab === "pomodoro" && <PomodoroScreen />}
            {tab === "sono" && <SleepScreen />}
            {tab === "perfil" && <ProfileRoute />}
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

function ProfileRoute() {
  const { progress, streak, dailyGoalXP, dailyGoalSettings, updateDailyGoal } = useGame();
  return (
    <ProfileScreenView
      progress={progress}
      streak={streak}
      dailyGoalXP={dailyGoalXP}
      dailyGoalSettings={dailyGoalSettings}
      updateDailyGoal={updateDailyGoal}
    />
  );
}
