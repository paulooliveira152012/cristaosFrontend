import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const VerifyAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "Verifying your account... Please check your email"
  );
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // <- NOVO

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `${baseUrl}/api/users/verifyAccount/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Conta verificada com sucesso! Redirecionando para login..."
        );
        setIsVerified(true); // <- MARCA COMO VERIFICADO
        window.history.replaceState({}, document.title, "/verifyAccount");

        console.log("isVerified?", isVerified);
        console.log("Conta verificada com sucesso!");

        // setTimeout(() => {
        //   navigate("/login");
        // }, 2000);

        // Evita loop removendo o token da URL
        // navigate("/verifyAccount", { replace: true });
      } else {
        setMessage(data.message || "Link inválido ou expirado.");
        setExpired(true);
      }
    } catch (error) {
      setMessage("Erro ao verificar a conta. Tente novamente.");
      setExpired(true);
    }
  };

  const handleResendLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/users/resendVerificationEmail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("Novo link enviado para o seu e-mail!");
      setExpired(false);
    } catch (err) {
      setMessage(err.message || "Erro ao reenviar link por e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendLinkBySms = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl}/api/users/resendVerificationByPhone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage("Novo link enviado por SMS!");
      setExpired(false);
    } catch (err) {
      setMessage(err.message || "Erro ao reenviar link por telefone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verifyAccountPage">
      <h2>{message}</h2>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button onClick={handleResendLink} disabled={loading}>
          {loading ? "Enviando..." : "Reenviar link por e-mail"}
        </button>

        <button onClick={handleSendLinkBySms} disabled={loading}>
          {loading ? "Enviando..." : "Receber link por SMS"}
        </button>
      </div>
    </div>
  );
};

export default VerifyAccount;
