import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase.js";
import "./AuthScreen.css";

const mensagensErroAuth = {
  "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
  "auth/invalid-credential": "E-mail ou senha inválidos.",
  "auth/invalid-email": "Informe um endereço de e-mail válido.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
};

function AuthScreen({ message = "" }) {
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
        await createUserWithEmailAndPassword(auth, email, password);
        setNotice("Conta criada com sucesso.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (authError) {
      setError(
        mensagensErroAuth[authError.code] ||
          "Não foi possível autenticar. Verifique seus dados e tente novamente."
      );
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
      </section>
    </main>
  );
}

export default AuthScreen;