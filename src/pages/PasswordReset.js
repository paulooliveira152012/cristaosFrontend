import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useSearchParams, useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_API_BASE_URL

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Get the token from URL query params
  const [success, setSuccess] = useState(false)
  useEffect(() => {
    // If no token is provided in the URL, set an error
    if (!token) {
      setError("Token inválido ou não encontrado.");
    }
  }, [token]);

  // Function to handle password update
  const updatePassword = async (e) => {
    e.preventDefault();
    console.log("Submitting password update request");

    try {
      const response = await fetch(`${baseUrl}/api/users/resetPassword`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token, // Pass the reset token along with the request
          email,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Password updated successfully", data);
        setSuccess(true)
        setTimeout(() => {
          navigate("/login"); // Redirect to login after successful reset
        }, 5000)
      } else {
        setError(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setError("Update failed. Please try again.");
    }
  };

  return (
    <div>
      <Header navigate={navigate} />
      <div style={styles.formContainer}>
        <form style={styles.form} onSubmit={updatePassword}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></input>
          <label style={styles.label}>Nova Senha</label>
          <input
            style={styles.input}
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          ></input>
          <label style={styles.label}>Repetir Nova Senha</label>
          <input
            style={styles.input}
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          ></input>
          <button type="submit" style={styles.button}>
            Redefinir senha
          </button>

          {/* Display error message */}
          {error && <p style={styles.error}>{error}</p>}
        </form>

        {success && (
          <div className="modal">
            <div className="modal-content">
            <p className="successMessage">Senha atualizada!</p>
            </div>
          </div>
        )}
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
  error: {
    color: "red",
    marginTop: "15px",
  },
};

export default PasswordReset;
