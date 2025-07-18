import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import socket from "../socket";

const baseUrl = process.env.REACT_APP_API_BASE_URL

const Login = () => {
  // referenciar a logica de login do useUser
  const { login } = useUser();
  const navigate = useNavigate();

  // State to manage input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // connect to socket right away
  useEffect(() => {
    socket.connect();
  }, []);

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page    

    console.log("tentando alcancar backend")

    try {
      const response = await fetch(`${baseUrl}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }), // Sending email and password to backend
        credentials: "include", // Include credentials if applicable (cookies, auth headers, etc.)
      });


      const data = await response.json();

      if (response.ok) {
        console.log("Login successful!", data);
        login(data); // Log the user in

        // Emit userLoggedIn event to notify the server that the user is online
        socket.emit("userLoggedIn", {
          _id: data._id,
          email: data.email,
          profileImage: data.profileImage || "https://via.placeholder.com/50",
        });

        navigate("/"); // Redirect to home page on successful login
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <Header
        showLoginButton={false}
        showProfileImage={false}
        navigate={navigate}
      />
      <div style={styles.loginContainer}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email input */}
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email:
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* Password input */}
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          {/* Submit button */}
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>

        <p style={{ marginTop: 20 }}>
          Esqueceu a Senha?{" "}
          <Link style={{ textDecoration: "none" }} to={"/passwordResetLink"}>
            redefinir aqui
          </Link>
        </p>

        {/* Signup Link */}
        <div style={styles.signupSection}>
          <p>Não é um membro ainda?</p>
          <Link to="/signup" style={styles.link}>
            Criar conta
          </Link>
        </div>

        {/* Display error message */}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

// Basic styles
const styles = {
  loginContainer: {
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
    marginBottom: "5px",
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
    marginTop: "10px",
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

export default Login;
