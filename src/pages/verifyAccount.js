import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_API_BASE_URL

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
    console.log("baseUrl for confirming email:", baseUrl)
    
    const verifyToken = async () => {

      console.log("token needed for verifycation:", token)

      try {
        const response = await fetch(`${baseUrl}/api/users/verifyAccount/${token}`, {
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
