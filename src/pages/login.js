import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

import "../styles/Login.css";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
  // referenciar a logica de login do useUser
  const { connectSocket } = useSocket();
  const { login } = useUser();
  const navigate = useNavigate();

  // State to manage input fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    /* Inicializar o botão de login do Google */
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
        }
      );
    }
  }, []);

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page

    console.log("tentando alcancar backend");

    try {
      const response = await fetch(`${baseUrl}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }), // Sending email and password to backend
        credentials: "include", // Include credentials if applicable (cookies, auth headers, etc.)
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful!", data);
        login(data.user); // Log the user in

        // Emit userLoggedIn event to notify the server that the user is online
        // const s = connectSocket(data.token);
        // s.once("connect", () => {
        //   s.emit("addUser"); // servidor usa socket.data.userId; sem payload
        // });

        // conectar com o token (isso já vai disparar onConnect do UserContext)
        connectSocket(data.token);

        // depois de logar/deslogar:
        localStorage.setItem("auth:event", String(Date.now()));

        navigate("/"); // Redirect to home page on successful login
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(`Something went wrong. Please try again. ${err}`);
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      const res = await fetch(`${baseUrl}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          data.message || `Falha no login com Google (HTTP ${res.status})`
        );
        return;
      }

      // backend retorna { user, token }
      login(data.user);

      // conecta socket com token; o back já registra no 'connection'
      connectSocket(data.token);
      localStorage.setItem("auth:event", String(Date.now()));

      navigate("/");
    } catch (err) {
      console.error("Erro no login com Google:", err);
      setError("Erro ao tentar logar com o Google.");
    }
  };

  return (
    <div className="screenWrapper">
      <Header
        showLoginButton={false}
        showProfileImage={false}
        navigate={navigate}
      />
      <div className="loginContainer">
        <h2 className="title">Login</h2>

        <form onSubmit={handleLogin} className="form">
          {/* Email input */}
          <div className="formGroup">
            <label htmlFor="identifier" className="label">
              Email:
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="input"
            />
          </div>

          {/* Password input */}
          <div className="formGroup">
            <label htmlFor="password" className="label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
            />
          </div>

          {/* Submit button */}
          <button type="submit" className="button">
            Login
          </button>

          <div id="googleSignInDiv" style={{ marginTop: 20 }}></div>
        </form>

        <p style={{ marginTop: 20 }}>
          Esqueceu a Senha?{" "}
          <Link className="link" to="/passwordResetLink">
            redefinir aqui
          </Link>
        </p>

        {/* Signup Link */}
        <div className="signupSection">
          <p>Não é um membro ainda?</p>
          <Link to="/signup" className="link">
            Criar conta
          </Link>
        </div>

        {/* Display error message */}
        {error && (
          <div>
            <p className="error">{error}</p>

            {error === "Verifique sua conta antes de fazer login." && (
              <p style={{ marginTop: 10 }}>
                Não recebeu o email de verificação?{" "}
                <Link to="/resend-verification" className="link">
                  Reenviar agora
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
