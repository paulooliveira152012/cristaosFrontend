import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";
import { handleBack } from "../components/functions/headerFunctions";
import { useNavigate } from "react-router-dom";

const PrivateChat = () => {
  const { conversationId } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);

  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const navigate = useNavigate()

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // Entrar na sala de chat privada
    socket.emit("joinPrivateChat", conversationId);

    // Buscar mensagens antigas
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${baseURL}/api/dm/messages/${conversationId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    fetchMessages();

    // Escutar mensagens novas
    socket.on("newPrivateMessage", (newMsg) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    return () => {
      socket.emit("leavePrivateChat", conversationId);
      socket.off("newPrivateMessage");
    };
  }, [conversationId, currentUser]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      conversationId,
      sender: currentUser._id,
      message: message.trim(),
    };

    socket.emit("sendPrivateMessage", msg);
    setMessages((prev) => [...prev, { ...msg, username: currentUser.username, timestamp: new Date() }]);
    setMessage("");
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatPageWrapper">
        <Header 
            showProfileImage={false}
            navigate={navigate}
        />
      <div className="messagesContainer">
        <div className="chatPageContainer" ref={messagesContainerRef}>
          <div className="messagesContainer">
            {messages.map((msg, index) => (
              <div key={index} className="messageItem">
                <strong>{msg.username || "Você"}:</strong> {msg.message}
                <br />
                <small>{format(new Date(msg.timestamp || new Date()), "PPpp")}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chatPageInputContainer">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Digite sua mensagem..."
          className="input"
        />
        <button onClick={sendMessage} className="sendBtn">Enviar</button>
      </div>
    </div>
  );
};

export default PrivateChat;
