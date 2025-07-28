import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";
import { handleLeaveDirectMessagingChat } from "../components/functions/headerFunctions";

const PrivateChat = () => {
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // fetch messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/messages/${conversationId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    // mark chat as read
    const markAsRead = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/markAsRead/${conversationId}`,
          {
            method: "POST",
            credentials: "include",
          }
        );
        socket.emit("privateChatRead", {
          conversationId,
          userId: currentUser._id,
        });
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    };

    // Listener fora da função principal
    const handleIncomingMessage = (newMsg) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          const alreadyExists = prev.some((msg) => msg._id === newMsg._id);
          if (!alreadyExists) return [...prev, newMsg];
          return prev;
        });
      }
    };

    // Entrar na sala e buscar mensagens
    socket.emit("joinPrivateChat", {
      conversationId,
      userId: currentUser._id,
    });

    fetchMessages();
    markAsRead();

    // Escutar mensagens novas (inclusive as de sistema)
    socket.on("newPrivateMessage", handleIncomingMessage);
  }, [conversationId, currentUser, baseURL]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      conversationId,
      sender: currentUser._id,
      message: message.trim(),
    };

    socket.emit("sendPrivateMessage", msg);
    setMessage("");
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // socket.on("userLeftPrivateChat", ({ conversationId: convId, leftUser }) => {
  //     if (convId === conversationId) {
  //       console.log(`🟠 ${leftUser.username} saiu da conversa!`);
  //     }
  //   });

  return (
    <div className="chatPageWrapper">
      <Header
        showProfileImage={false}
        navigate={navigate}
        showLeavePrivateRoomButton={true}
        handleLeaveDirectMessagingChat={handleLeaveDirectMessagingChat}
        roomId={conversationId}
      />

      <div className="messagesContainer">
        <div className="chatPageContainer" ref={messagesContainerRef}>
          <div className="messagesContainer">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`messageItem ${msg.system ? "systemMessage" : ""}`}
              >
                {msg.system ? (
                  <em>{msg.message}</em>
                ) : (
                  <>
                    <strong>{msg.username || "Você"}:</strong> {msg.message}
                    <br />
                    <small>
                      {format(new Date(msg.timestamp || new Date()), "PPpp")}
                    </small>
                  </>
                )}
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
        <button onClick={sendMessage} className="sendBtn">
          Enviar
        </button>
      </div>
    </div>
  );
};

export default PrivateChat;
