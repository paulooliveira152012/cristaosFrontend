import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const VerifyAccount = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your account...");

  console.log("Pagina de verificacao de conta");

  // Extract token from the URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  console.log("queryParams is:", queryParams);
  console.log("token:", token);

  useEffect(() => {
    // Call the API to verify the token
    const verifyToken = async () => {
      try {
        const api =
          process.env.NODE_ENV === "production"
            ? `https://cristaosbackend.onrender.com/api/users/verifyAccount?token=${token}`
            : `http://localhost:5001/api/users/verifyAccount?token=${token}`; // Local development URL

        const response = await fetch(api, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Account verified successfully", data);
          setMessage("Account verified successfully! Redirecting to login...");
          setTimeout(() => {
            navigate("/login"); // Redirect to login after 2 seconds
          }, 2000);
        } else {
          setMessage(data.message || "Failed to verify the account.");
          console.error("Verification failed", data.message);
        }
      } catch (error) {
        setMessage("Error verifying account. Please try again later.");
        console.error("Error verifying account:", error);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token, navigate]);

  return (
    <div>
      <h2>{message}</h2>
    </div>
  );
};

export default VerifyAccount;

/* 
verification token is stored in db
but when clicking the link in email it says it is 
invalid or expired when checking 
*/

// const response = await fetch(`http://localhost:5001/api/users/verify-email/${email}`, {
// const response = await fetch(`https://cristaosbackend.onrender.com/api/users/verify-email/${email}`, {
