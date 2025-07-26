import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";

const PrivateChat = () => {
  const { id: conversationId } = useParams();

  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  console.log("conversationId:",conversationId)

  useEffect(() => {
    if (!conversationId || !currentUser) return;


    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/messages/${conversationId}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    const markAsRead = async () => {
      try {
        const res = await fetch(`${baseURL}/api/dm/markAsRead/${conversationId}`, {
          method: "POST",
          credentials: "include",
        });
        console.log("🔵 Conversa marcada como lida");
        socket.emit("privateChatRead", { conversationId, userId: currentUser._id });
        const data = await res.json();
        console.log("mensagens nao lidas: ", data)
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    };

    const enterRoomAndFetch = async () => {
      socket.emit("joinPrivateChat", conversationId);
      await fetchMessages();
      await markAsRead();

      socket.on("newPrivateMessage", (newMsg) => {
  if (newMsg.conversationId === conversationId) {
    setMessages((prev) => {
      const alreadyExists = prev.some((msg) => msg._id === newMsg._id);
      if (!alreadyExists) return [...prev, newMsg];
      return prev;
    });
  }
});

    };

    enterRoomAndFetch();

    return () => {
      socket.emit("leavePrivateChat", conversationId);
      socket.off("newPrivateMessage");
    };
  }, [conversationId, currentUser, baseURL]);

  const sendMessage = () => {
    if (!message.trim()) return;

    console.log("📤 Emitindo para conversa:", conversationId); // <--- aqui!

    const msg = {
      conversationId,
      sender: currentUser._id,
      message: message.trim(),
    };

    socket.emit("sendPrivateMessage", msg);
    setMessage(""); // limpa input
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatPageWrapper">
      <Header showProfileImage={false} navigate={navigate} />
      <div className="messagesContainer">
        <div className="chatPageContainer" ref={messagesContainerRef}>
          <div className="messagesContainer">
            {messages.map((msg, index) => (
              <div key={index} className="messageItem">
                <strong>{msg.username || "Você"}:</strong> {msg.message}
                <br />
                <small>
                  {format(new Date(msg.timestamp || new Date()), "PPpp")}
                </small>
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
