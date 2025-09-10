// src/pages/Login.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/Login.css";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

/* Modal de Termos (reseta a caixa ao abrir) */
const TermsModal = ({ open, onClose, onConfirm }) => {
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Termos e Condições</h3>

        <div style={{ maxHeight: 220, overflow: "auto", margin: "12px 0" }}>
          <p>
            Ao continuar, você declara que leu e concorda com os{" "}
            <a href="/termsOfUse" target="_blank" rel="noreferrer" style={{color: "yellow"}}>Termos de Uso</a>{" "}
            e a{" "}
            <a href="/privacyPolicy" target="_blank" rel="noreferrer" style={{color: "yellow"}}>Política de Privacidade</a>{" "}
            do Cristãos App.
          </p>
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>Li e concordo com os Termos e a Privacidade</span>
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="button ghost" onClick={onClose}>Cancelar</button>
          <button className="button" onClick={onConfirm} disabled={!checked}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const { connectSocket } = useSocket();
  const { login } = useUser();
  const navigate = useNavigate();

  // formulário (email/senha)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // termos (modal) + pendências
  const [showTerms, setShowTerms] = useState(false);
  const [pendingCred, setPendingCred] = useState(null); // Google credential
  const [pendingEmail, setPendingEmail] = useState(null); // { identifier, password }
  const [submittingGoogle, setSubmittingGoogle] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, []);

  // ------- LOGIN EMAIL/SENHA -------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    // primeira tentativa SEM acceptTerms
    setPendingEmail({ identifier, password });
    await submitPasswordLogin({ identifier, password }, false);
  };

  const submitPasswordLogin = async (creds, acceptTerms) => {
    if (submittingEmail) return;
    setSubmittingEmail(true);
    try {
      const response = await fetch(`${baseUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: creds.identifier,
          password: creds.password,
          acceptTerms, // <- chave para registrar aceite
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 428 && data?.code === "TERMS_REQUIRED") {
          setShowTerms(true);
          return;
        }
        setError(data.message || "Login failed");
        return;
      }

      // OK
      login(data.user);
      connectSocket(data.token);
      localStorage.setItem("auth:event", String(Date.now()));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmittingEmail(false);
    }
  };

  // ------- LOGIN GOOGLE -------
  const handleGoogleCallback = async (response) => {
    setError("");
    const cred = response?.credential;
    if (!cred) return;

    // primeira tentativa SEM acceptTerms
    setPendingCred(cred);
    await submitGoogleLogin(cred, false);
  };

  const submitGoogleLogin = async (credential, acceptTerms) => {
    if (submittingGoogle) return;
    setSubmittingGoogle(true);

    try {
      const res = await fetch(`${baseUrl}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential, acceptTerms }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 428 && data?.code === "TERMS_REQUIRED") {
          setShowTerms(true);
          return;
        }
        setError(data.message || `Falha no login com Google (HTTP ${res.status})`);
        return;
      }

      // OK
      login(data.user);
      connectSocket(data.token);
      localStorage.setItem("auth:event", String(Date.now()));
      navigate("/");
    } catch (err) {
      console.error("Erro no login com Google:", err);
      setError("Erro ao tentar logar com o Google.");
    } finally {
      setSubmittingGoogle(false);
    }
  };

  // ------- MODAL: confirmar/cancelar -------
  const confirmTermsAndContinue = async () => {
    setShowTerms(false);

    // Se for Google, reenvia com acceptTerms: true
    if (pendingCred) {
      const cred = pendingCred;
      setPendingCred(null);
      await submitGoogleLogin(cred, true);
      return;
    }

    // Se for email/senha, reenvia com acceptTerms: true
    if (pendingEmail) {
      const creds = pendingEmail;
      setPendingEmail(null);
      await submitPasswordLogin(creds, true);
      return;
    }
  };

  const closeTerms = () => {
    setShowTerms(false);
    // não limpar pending* aqui para permitir confirmar depois se desejar
    // (mas se preferir, pode limpar para obrigar o usuário a recomeçar o fluxo)
  };

  return (
    <div className="screenWrapper">
      <Header showLoginButton={false} showProfileImage={false} navigate={navigate} />

      <TermsModal open={showTerms} onClose={closeTerms} onConfirm={confirmTermsAndContinue} />

      <div className="loginContainer">
        <h2 className="title">Login</h2>

        <form onSubmit={handleLogin} className="form">
          <div className="formGroup">
            <label htmlFor="identifier" className="label">Email:</label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password" className="label">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
            />
          </div>

          <button type="submit" className="button" disabled={submittingEmail}>
            {submittingEmail ? "Entrando..." : "Login"}
          </button>

          <div id="googleSignInDiv" style={{ marginTop: 20 }} />
        </form>

        <p style={{ marginTop: 20 }}>
          Esqueceu a Senha?{" "}
          <Link className="link" to="/passwordResetLink">redefinir aqui</Link>
        </p>

        <div className="signupSection">
          <p>Não é um membro ainda?</p>
          <Link to="/signup" className="link">Criar conta</Link>
        </div>

        {error && (
          <div>
            <p className="error">{error}</p>
            {error === "Verifique sua conta antes de fazer login." && (
              <p style={{ marginTop: 10 }}>
                Não recebeu o email de verificação?{" "}
                <Link to="/resend-verification" className="link">Reenviar agora</Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
