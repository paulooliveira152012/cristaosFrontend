import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${baseUrl}/api/users/resendVerificationEmail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Verificação reenviada com sucesso! Verifique sua caixa de entrada."
        );
        setTimeout(() => navigate("/login"), 5000);
      } else {
        setMessage(data.message || "Não foi possível reenviar.");
      }
    } catch (err) {
      setMessage("Erro ao reenviar verificação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screenWrapper">
      <Header
        showBackArrow={true}
        showProfileImage={false}
        onBack={() => {
          handleBack(navigate);
        }}
      />
      <div className="container">
        <h2>Reenviar verificação</h2>
        <form onSubmit={handleResend} className="form">
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Reenviar"}
          </button>
          {message && <p className="marginTop15">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default ResendVerification;
