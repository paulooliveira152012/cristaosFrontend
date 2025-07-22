import { useState } from "react";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Use the browser-friendly AWS SDK
import Header from "../components/Header";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid"; // For generating unique file names

const baseUrl = process.env.REACT_APP_API_BASE_URL

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
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [file, setFile] = useState(null); // Store file for S3 upload

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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Signup successful!", data);
        // Navigate to the email verification page after successful signup
        navigate("/verifyAccount", { state: { email } });
      } else {
        setError(data.message || "Signup failed"); // Set error message from the response
      }
    } catch (err) {
      console.error("Error during signup:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <Header showProfileImage={false} navigate={navigate} />
      <div style={styles.signupContainer}>
        <h2 style={{ color: "gray", marginBottom: 20, fontStyle: "italic" }}>
          Signup
        </h2>
        <form onSubmit={handleSignup} style={styles.form}>
          {/* Image selection */}
          <div style={styles.formGroup}>
            <div
              style={{
                ...styles.imageContainer,
                backgroundImage: profileImage
                  ? `url(${profileImage})`
                  : `url('https://via.placeholder.com/150x150?text=Upload+Image')`, // Default or selected image
              }}
              onClick={handleImagePicker}
            />
          </div>

          {/* Username input */}
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>
              Username:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </div>

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

              {/* phone input */}
          <div style={styles.formGroup}>
            <label htmlFor="phone" style={styles.label}>
              Phone:
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            Signup
          </button>
        </form>

        {/* Display error message */}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

// Basic styles
const styles = {
  signupContainer: {
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
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  },
  error: {
    color: "red",
    marginTop: "15px",
  },
  imageContainer: {
    width: "150px",
    height: "150px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: "#ddd",
    borderRadius: "50%",
    cursor: "pointer",
    margin: "0 auto",
  },
};

export default Signup;
