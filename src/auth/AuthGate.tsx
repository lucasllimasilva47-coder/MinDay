import { useEffect, useState } from "react";
import { GameProvider } from "../game/GameProvider";
import { AccountSection } from "../components/screens/AccountSection";
import { Mascot } from "../components/Mascot";
import { brand } from "../components/brand";
import { Button } from "../components/ui";
import { AppShell } from "../components/app/AppShell";
import { supabase } from "./supabase";

type AuthStatus = "checking" | "signed-in" | "signed-out" | "error";

export function AuthGate() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [authError, setAuthError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setStatus("signed-out");
      return;
    }

    let active = true;
    let authEventReceived = false;
    setStatus("checking");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (!active) return;
      setAuthError("");
      setStatus(session ? "signed-in" : "signed-out");
    });

    const handleSessionError = (error: unknown) => {
      if (!active || authEventReceived) return;
      console.error("Não foi possível verificar a sessão da conta.", error);
      setAuthError("Não foi possível verificar sua conta. Confira sua conexão e tente novamente.");
      setStatus("error");
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authEventReceived) return;
        if (error) {
          handleSessionError(error);
          return;
        }
        setStatus(data.session ? "signed-in" : "signed-out");
      })
      .catch(handleSessionError);

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [retryCount]);

  const signOut = async () => {
    if (!supabase) return;
    setSignOutBusy(true);
    setSignOutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Não foi possível sair da conta.", error);
      setSignOutError(
        error instanceof Error ? error.message : "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setSignOutBusy(false);
    }
  };

  if (status === "checking") {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4 text-white"
        style={{ background: brand.bg }}
      >
        <p role="status">Verificando sua conta...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-white"
        style={{ background: brand.bg }}
      >
        <p role="alert" className="max-w-md text-rose-200">{authError}</p>
        <Button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="bg-sky-500 hover:bg-sky-600"
        >
          Tentar novamente
        </Button>
      </main>
    );
  }

  if (status === "signed-in") {
    return (
      <GameProvider>
        <AppShell
          onSignOut={signOut}
          signOutBusy={signOutBusy}
          signOutError={signOutError}
        />
      </GameProvider>
    );
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10 text-white"
      style={{ background: brand.bg }}
    >
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <Mascot size={80} />
          <h1 className="mt-3 text-3xl font-black">{brand.name}</h1>
          <p className="mt-2 text-sm text-white/70">
            Entre ou crie sua conta para continuar.
          </p>
        </div>
        <AccountSection />
      </div>
    </main>
  );
}
