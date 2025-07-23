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
    <>
      <Header
        showBackArrow={true}
        onBack={() => {
          handleBack(navigate);
        }}
      />
      <div style={styles.container}>
        <h2>Reenviar verificação</h2>
        <form onSubmit={handleResend} style={styles.form}>
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Reenviar"}
          </button>
          {message && <p style={{ marginTop: 15 }}>{message}</p>}
        </form>
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ResendVerification;
