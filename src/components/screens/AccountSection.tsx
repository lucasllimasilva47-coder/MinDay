import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { supabase } from "../../auth/supabase";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "../ui";

type AccountMode = "sign-in" | "sign-up";

export function AccountSection() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AccountMode>("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!supabase) {
      setError("O serviço de contas ainda não foi configurado.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (authError) throw authError;
        setMessage(
          data.session
            ? "Conta criada com sucesso."
            : "Conta iniciada! Confira seu e-mail para confirmar o cadastro."
        );
        setPassword("");
        setConfirmPassword("");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setMessage("Você entrou na sua conta.");
        setPassword("");
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Não foi possível concluir a operação. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setMessage("Você saiu da sua conta.");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Não foi possível sair da conta. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: AccountMode) => {
    setMode(nextMode);
    setMessage("");
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Card className="bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          {user ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          Conta MinDay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supabase && (
          <div role="status" className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
            Cadastro ainda não ativado. Configure <code>VITE_SUPABASE_URL</code> e{" "}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> no arquivo <code>.env.local</code>.
          </div>
        )}

        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-white/80">
              Conectado como <span className="font-semibold text-white">{user.email}</span>
            </p>
            <Button
              type="button"
              onClick={signOut}
              disabled={busy || !supabase}
              className="bg-white/10 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => switchMode("sign-up")}
                aria-pressed={mode === "sign-up"}
                className={mode === "sign-up" ? "bg-emerald-500" : "bg-white/10 hover:bg-white/20"}
              >
                Criar conta
              </Button>
              <Button
                type="button"
                onClick={() => switchMode("sign-in")}
                aria-pressed={mode === "sign-in"}
                className={mode === "sign-in" ? "bg-emerald-500" : "bg-white/10 hover:bg-white/20"}
              >
                Entrar
              </Button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "sign-up" && (
                <div>
                  <label htmlFor="account-name" className="mb-1.5 block text-sm font-semibold">
                    Nome <span className="font-normal text-white/60">(opcional)</span>
                  </label>
                  <Input
                    id="account-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    maxLength={200}
                    placeholder="Como podemos chamar você?"
                  />
                </div>
              )}
              <div>
                <label htmlFor="account-email" className="mb-1.5 block text-sm font-semibold">
                  E-mail
                </label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="voce@exemplo.com"
                />
              </div>
              <div>
                <label htmlFor="account-password" className="mb-1.5 block text-sm font-semibold">
                  Senha
                </label>
                <Input
                  id="account-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>
              {mode === "sign-up" && (
                <div>
                  <label htmlFor="account-confirm-password" className="mb-1.5 block text-sm font-semibold">
                    Confirmar senha
                  </label>
                  <Input
                    id="account-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="Digite a senha novamente"
                  />
                </div>
              )}
              <Button
                type="submit"
                disabled={busy || !supabase}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Aguarde..." : mode === "sign-up" ? "Criar minha conta" : "Entrar"}
              </Button>
            </form>
          </>
        )}

        {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
        {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
        <p className="text-xs text-white/60">
          Sua conta autentica o acesso; tarefas e progresso ainda ficam salvos neste navegador e não são sincronizados.
        </p>
      </CardContent>
    </Card>
  );
}
