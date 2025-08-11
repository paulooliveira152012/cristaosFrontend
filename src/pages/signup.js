import { useEffect, useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Use the browser-friendly AWS SDK
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { json, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid"; // For generating unique file names
import "../styles/signUp.css";
import { fetchAllChurches } from "./functions/signupFunctions";

// import { response } from "express";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

// Configure AWS S3 Client
const s3 = new S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  // Step 1: Get presigned URL from backend
  const res = await fetch(`${baseUrl}/api/upload-url`);
  const { uploadURL, key } = await res.json();

  console.log(`uploadURL: ${uploadURL}, key: ${key}`);

  // Step 2: Upload directly to S3 using the URL
  const upload = await fetch(uploadURL, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: file,
  });

  if (!upload.ok) {
    throw new Error("Failed to upload to S3");
  }

  const region = "us-east-2";
  const BucketName = "cristaos";
  return `https://${BucketName}.s3.${region}.amazonaws.com/${key}`;
};

const Signup = () => {
  const { login } = useUser();
  const navigate = useNavigate();

  // State to manage input fields
  const [profileImage, setProfileImage] = useState(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [churches, setChurches] = useState([]);
  const [church, setChurch] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null); // Store file for S3 upload

  const [newUserId, setNewUserId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAllChurches(setChurches);
  }, []);

  // Handle image selection
  const handleImagePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        setProfileImage(URL.createObjectURL(selectedFile)); // For preview only
        setFile(selectedFile); // Store the file for S3 upload
        console.log("Image selected for upload:", selectedFile);
      }
    };
    input.click();
  };

  // Handle form submission for signup
  const handleSignup = async (e) => {
    e.preventDefault();

    console.log("signing up...");

    // Validate that required fields are provided
    if (!username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("The password must be at least 6 characters long.");
      return;
    }

    try {
      let imageUrl = null;
      if (file) {
        // Upload image to S3 and get the URL, if a file is selected
        imageUrl = await uploadImageToS3(file);
      }

      const response = await fetch(`${baseUrl}/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          phone,
          password,
          profileImage: imageUrl, // Include S3 URL in the request, if applicable
          church,
        }),
      });

      console.log("rota encontrada");

      const data = await response.json();

      if (response.ok) {
        console.log("Signup successful!", data);
        // Navigate to the email verification page after successful signup
        // navigate("/verifyAccount", { state: { email } });
        console.log("new userId:", data.userId);
        setNewUserId(data.userId);
        setShowModal(true);
      } else {
        setError(data.message || "Signup failed"); // Set error message from the response
      }
    } catch (err) {
      console.error("Error during signup:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  const verifyByEmail = async () => {
    console.log(`verificando conta por e-mail ${newUserId}`);

    setIsLoading(true);

    try {
      const response = await fetch(
        `${baseUrl}/api/users/sendVerificationByEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: newUserId }), // Use "userId" como chave
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Email enviado com sucesso!");
      } else {
        console.error("Erro ao enviar email:", data.message);
      }
    } catch (error) {
      console.log("Erro ao enviar email:", error);
    } finally {
      setIsLoading(false);
      navigate("/login");
    }
  };

  const verifyByPhone = async () => {
    console.log(`verificando conta por telefone ${newUserId}`);

    try {
      const response = await fetch(
        `${baseUrl}/api/users/sendVerificationByPhone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: newUserId }), // Use "userId" como chave
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Mensagem enviada!");
      } else {
        console.error("Erro ao enviar SMS:", data.message);
      }
    } catch (error) {
      console.log("erro ao enviar mensagem SMS:", error);
    }
  };

  return (
    <div className="screenWrapper">
      <div className="scrollable">
        <Header showProfileImage={false} navigate={navigate} />

        <div className="signupContainer">
          <h2 className="signupTitle">Signup</h2>

          <form onSubmit={handleSignup} className="form">
            {/* Image selection */}
            <div className="formGroup">
              <div
                className="imageContainer"
                style={{
                  backgroundImage: profileImage
                    ? `url(${profileImage})`
                    : `url('https://via.placeholder.com/150x150?text=Upload+Image')`,
                }}
                onClick={handleImagePicker}
              />
            </div>

            {/* Username input */}
            <div className="formGroup">
              <label htmlFor="username" className="label">
                Username:
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input"
              />
            </div>

            {/* Email input */}
            <div className="formGroup">
              <label htmlFor="email" className="label">
                Email:
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
              />
            </div>

            {/* Phone input */}
            <div className="formGroup">
              <label htmlFor="phone" className="label">
                Phone:
              </label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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

            <div className="formGroup">
              <label htmlFor="password" className="label">
                Confirm Password:
              </label>
              <input
                type="password"
                id="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input"
              />
            </div>

            <select 
              value={church} 
              onChange={(e) => setChurch(e.target.value)}
              required
            >
               <option value="">Selecione uma igreja</option>

              {churches.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Submit button */}
            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Signup"}
            </button>
          </form>

          {/* Display error message */}
          {error && <p className="error">{error}</p>}
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Conta criada com sucesso!</h2>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="loadingSpinner"
                />
              )}

              <p>por favor verificar conta para ter acesso.</p>

              <button onClick={verifyByEmail}>Verificar por email</button>
              <button
                onClick={verifyByPhone}
                disabled
                className="disabledButton"
              >
                Verificar por telefone
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
