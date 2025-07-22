import React, { useEffect } from "react";

const GoogleLoginButton = () => {
  useEffect(() => {
    /* global google */
    window.google.accounts.id.initialize({
      client_id: "SEU_CLIENT_ID_DO_GOOGLE",
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-login-button"),
      { theme: "outline", size: "large" }
    );
  }, []);

  const handleCredentialResponse = async (response) => {
    console.log("Token JWT do Google:", response.credential);
    
    // Envie esse token pro seu backend para validar/autenticar
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      console.log("Usuário autenticado:", data);
    } catch (error) {
      console.error("Erro ao autenticar com backend:", error);
    }
  };

  return <div id="google-login-button"></div>;
};

export default GoogleLoginButton;
