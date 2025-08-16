import React, { useEffect } from "react";

const GoogleLoginButton = () => {
  useEffect(() => {
    // garanta que o script do GSI está no index.html:
    // <script src="https://accounts.google.com/gsi/client" async defer></script>

    /* global google */
    google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("google-login-button"),
      { theme: "outline", size: "large" }
    );
  }, []);

  const handleCredentialResponse = async ({ credential }) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // <— importante p/ cookie
          body: JSON.stringify({ credential }), // <— nome certo
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      console.log("Usuário autenticado:", data);
      // TODO: salvar user/token no seu contexto/estado
    } catch (err) {
      console.error("Erro ao autenticar com backend:", err);
    }
  };

  return <div id="google-login-button"></div>;
};

export default GoogleLoginButton;
