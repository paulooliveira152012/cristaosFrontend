import { useEffect, useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Use the browser-friendly AWS SDK
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import { json, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid"; // For generating unique file names
import "../styles/signUp.css";
import { fetchAllChurches } from "./functions/signupFunctions";

const CHURCH_NON_DENOM = "__NON_DENOM__";
const CHURCH_NONE = "__NO_CHURCH__";

const isValidObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(v);

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [church, setChurch] = useState("");

  // state to handle page activity
  const [churches, setChurches] = useState([]);
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
    setError("");
    setIsLoading(true);

    // Validate that required fields are provided
    if (!username || !email || !password || !church) {
      setError("username, email, senha e igreja sao necessarios.");
      setIsLoading(false);
      return;
    }

    // igreja deve ser um ObjectId válido OU uma das sentinelas
    if (
      !isValidObjectId(church) &&
      church !== CHURCH_NON_DENOM &&
      church !== CHURCH_NONE
    ) {
      setError("Selecione uma igreja válida.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("The password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      let imageUrl = null;
      if (file) {
        // Upload image to S3 and get the URL, if a file is selected
        imageUrl = await uploadImageToS3(file);
      }

      const payload = {
      firstName,
      lastName,
      city,
      state,
      phone,
      password,
      username,
      email,
      profileImage: imageUrl,
      church: null,
      churchAffiliation: null
    };

    // Interpreta a seleção da igreja
    if (church === CHURCH_NON_DENOM) {
      payload.church = null; // não envia ObjectId
      payload.churchAffiliation = "non_denom";
    } else if (church === CHURCH_NONE) {
      payload.church = null;
      payload.churchAffiliation = "none";
    } else {
      payload.church = church; // ObjectId
      payload.churchAffiliation = "member"; // opcional, mas útil
    }

      const response = await fetch(`${baseUrl}/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          payload
        ),
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
    } finally {
      setIsLoading(false);
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

            {/* firstName input */}
            <div className="formGroup">
              <label htmlFor="firstName" className="label">Primeiro nome</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
              />
            </div>
            {/* lastName input */}
            <div className="formGroup">
              <label htmlFor="lastName" className="label">Sobrenome</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
              />
            </div>
            {/* city input */}
            <div className="formGroup">
              <label htmlFor="city" className="label">Cidade</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input"
              />
            </div>
            {/* state input */}
            <div className="formGroup">
              <label htmlFor="state" className="label">Estado</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input"
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
                type="email"
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
                type="tel"
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
              <label htmlFor="confirmPassword" className="label">
                Confirm Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
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

              <optgroup label="Outras opções">
                <option value={CHURCH_NON_DENOM}>Não denominacional</option>
                <option value={CHURCH_NONE}>
                  Não frequento nenhuma igreja
                </option>
              </optgroup>

              <optgroup label="Igrejas">
                {churches.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
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
