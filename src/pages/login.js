// src/pages/Login.jsx
import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/Login.css";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

/* Modal simples de Termos */
const TermsModal = ({ open, onClose, onConfirm }) => {
  const [checked, setChecked] = useState(false);
  if (!open) return null;

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Termos e Condições</h3>

        <div style={{ maxHeight: 220, overflow: "auto", margin: "12px 0" }}>
          <p>
            Ao continuar, você declara que leu e concorda com os{" "}
            <a href="/termsOfUse" target="_blank" rel="noreferrer">Termos de Uso</a>{" "}
            e a{" "}
            <a href="/privacy" target="_blank" rel="noreferrer">Política de Privacidade</a>{" "}
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

  // formulario (email/senha)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // termos + google
  const [showTerms, setShowTerms] = useState(false);
  const [pendingCred, setPendingCred] = useState(null); // guarda credential do Google
  const [submittingGoogle, setSubmittingGoogle] = useState(false);

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

  // ---- Login por e-mail/senha (sem termos aqui; se quiser, trate 428 também) ----
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${baseUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
        credentials: "include",
      });
      const data = await response.json();

      // dica: se seu /login também retornar 428 TERMS_REQUIRED,
      // você pode abrir o mesmo modal e, ao confirmar, chamar um endpoint
      // /users/accept-terms para marcar o aceite antes de completar o login.

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      login(data.user);
      connectSocket(data.token);
      localStorage.setItem("auth:event", String(Date.now()));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  // ---- Google One Tap/Button ----
  const handleGoogleCallback = async (response) => {
    setError("");
    const cred = response?.credential;
    if (!cred) return;

    // Primeiro tentamos logar SEM aceitar termos;
    // se o backend exigir (428 TERMS_REQUIRED), abrimos o modal.
    setPendingCred(cred);
    await submitGoogleLogin(cred, false);
  };

  const submitGoogleLogin = async (credential, acceptTerms) => {
    if (!credential || submittingGoogle) return;
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
        // Se o backend exige aceite, abrimos o modal
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

  // Confirmou termos no modal → reenviamos com acceptTerms: true
  const confirmTermsAndContinue = async () => {
    if (!pendingCred) return;
    setShowTerms(false);
    await submitGoogleLogin(pendingCred, true);
    setPendingCred(null);
  };

  const closeTerms = () => {
    setShowTerms(false);
    // se fechar, limpamos a credencial; o usuário pode clicar de novo no botão do Google
    setPendingCred(null);
  };

  return (
    <div className="screenWrapper">
      <Header showLoginButton={false} showProfileImage={false} navigate={navigate} />

      <TermsModal
        open={showTerms}
        onClose={closeTerms}
        onConfirm={confirmTermsAndContinue}
      />

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

          <button type="submit" className="button">Login</button>

          <div id="googleSignInDiv" style={{ marginTop: 20 }}></div>
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
