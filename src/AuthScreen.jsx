import { useState } from "react";
import "./AuthScreen.css";

function AuthScreen({ supabase, message = "" }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (!data.session) {
          setNotice("Confira seu e-mail para confirmar a conta e entrar.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
      }
    } catch (authError) {
      setError(authError.message || "Não foi possível autenticar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="auth-logo">CF</span>
          <span>Controle Financeiro</span>
        </div>

        {!supabase ? (
          <div className="auth-content">
            <p className="auth-eyebrow">Acesso em qualquer dispositivo</p>
            <h1>Configure sua conta</h1>
            <p className="auth-description">
              Para ativar o login e sincronizar seus dados, configure o Supabase
              seguindo as instruções do README.
            </p>
            <p className="auth-message" role="status">
              Faltam as variáveis VITE_SUPABASE_URL e
              VITE_SUPABASE_PUBLISHABLE_KEY.
            </p>
          </div>
        ) : (
          <div className="auth-content">
            <p className="auth-eyebrow">Acesso em qualquer dispositivo</p>
            <h1>{mode === "login" ? "Entre na sua conta" : "Crie sua conta"}</h1>
            <p className="auth-description">
              Seus dados financeiros ficam sincronizados com segurança.
            </p>

            {message && <p className="auth-message" role="status">{message}</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-message" role="status">{notice}</p>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="auth-email">E-mail</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <label htmlFor="auth-password">Senha</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </button>
            </form>

            <button
              className="auth-mode-toggle"
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
              }}
            >
              {mode === "login"
                ? "Ainda não tem uma conta? Criar conta"
                : "Já tem uma conta? Entrar"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default AuthScreen;