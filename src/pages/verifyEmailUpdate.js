import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const VerifyEmailUpdate = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("Verificando...");
  const alreadyTriedRef = useRef(false); // ← useRef em vez de useState
  const navigate = useNavigate()

  useEffect(() => {
    if (alreadyTriedRef.current) return;
    alreadyTriedRef.current = true; // ← bloqueia chamadas futuras

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/confirm-email-update/${token}`);
        const text = await res.text();

        if (!res.ok) throw new Error(text || "Erro na verificação");

        console.log("✅ EMAIL ATUALIZADO COM SUCESSO");
        setStatus("✅ " + text);

        setTimeout(() => {
            navigate('/login')
        }, 5000)
        
      } catch (error) {
        console.error("❌ Erro:", error);
        setStatus("❌ " + (error.message || "Erro ao confirmar e-mail."));
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>{status}</h2>
    </div>
  );
};

export default VerifyEmailUpdate;
