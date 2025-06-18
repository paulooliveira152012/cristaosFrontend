import { useState } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_API_BASE_URL

const PasswordResetLink = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // For success message
  const navigate = useNavigate();

  // Function to handle the password reset link request
  const requestResetLink = async (e) => {
    // Prevent the page from reloading
    e.preventDefault();
    console.log("Requesting password reset link for:", email);

    try {
      const response = await fetch(`${baseUrl}/api/users/forgotPassword`, {
        method: "POST", // Use POST for sending the email request
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Send only the email
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Reset link sent:", data);
        setSuccess("Link para redefinir senha enviado para o seu email."); // Success message
      } else {
        setError(data.message || "Erro ao enviar o link para redefinir senha.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        "Falha na solicitação de redefinição. Por favor tente novamente."
      );
    }
  };

  return (
    <div>
      <Header navigate={navigate} />
      <div style={styles.formContainer}>
        <p>Insira seu email para receber um link para redefinir sua senha</p>
        <form style={styles.form} onSubmit={requestResetLink}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></input>

          <button type="submit" style={styles.button}>
            Redefinir senha
          </button>

          {/* Display success or error message */}
          {success && <p style={styles.success}>{success}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

// Basic styles
const styles = {
  formContainer: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    margin: "10px 0",
    fontSize: "16px",
    color: "#333",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "30px",
  },
  buttonHover: {
    backgroundColor: "#0056b3",
  },
  signupSection: {
    marginTop: "20px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
  error: {
    color: "red",
    marginTop: "15px",
  },
};

export default PasswordResetLink;
