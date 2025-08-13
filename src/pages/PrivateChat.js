// src/pages/PrivateChat.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";
import {
  handleLeaveDirectMessagingChat,
  handleInviteBackToChat,
  handleFetchRoomMembers,
} from "../components/functions/headerFunctions";

const PrivateChat = () => {
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);
  const [isOtherUserInChat, setIsOtherUserInChat] = useState(false);
  const [hasOtherUserLeft, setHasOtherUserLeft] = useState(false);

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  // Busca presença inicial do outro usuário
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    handleFetchRoomMembers(conversationId, currentUser, (usersInChat) => {
      // garante que só conta o OUTRO usuário
      const others = Array.isArray(usersInChat)
        ? usersInChat.filter((u) => u?._id !== currentUser._id)
        : [];
      setIsOtherUserInChat(others.length > 0);
    });
  }, [conversationId, currentUser]);

  // Join/leave + listener de nova mensagem + fetch inicial + markAsRead
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const handleIncomingMessage = (newMsg) => {
      if (newMsg?.conversationId !== conversationId) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMsg._id);
        return exists ? prev : [...prev, newMsg];
      });
    };

    // Entrar na sala
    const join = () =>
      socket.emit("joinPrivateChat", {
        conversationId,
        userId: currentUser._id,
      });

    if (socket.connected) join();
    const handleConnect = () => join();
    socket.on("connect", handleConnect);

    // Listener para novas mensagens
    socket.on("newPrivateMessage", handleIncomingMessage);

    // Carrega histórico
    (async () => {
      try {
        const res = await fetch(`${baseURL}/api/dm/messages/${conversationId}`, {
          credentials: "include",
        });
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    })();

    // Marca como lida
    (async () => {
      try {
        await fetch(`${baseURL}/api/dm/markAsRead/${conversationId}`, {
          method: "POST",
          credentials: "include",
        });
        socket.emit("privateChatRead", {
          conversationId,
          userId: currentUser._id,
        });
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    })();

    // Cleanup
    return () => {
      socket.off("newPrivateMessage", handleIncomingMessage);
      socket.off("connect", handleConnect);
      socket.emit("leavePrivateChat", {
        conversationId,
        userId: currentUser._id,
      });
    };
  }, [conversationId, currentUser, baseURL]);

  // Presença em tempo real (lista completa dos presentes)
  useEffect(() => {
    const handlePresence = ({ conversationId: convId, users }) => {
      if (convId !== conversationId) return;
      const others = (users || []).filter((u) => u?._id !== currentUser?._id);
      setIsOtherUserInChat(others.length > 0);
    };
    socket.on("currentUsersInPrivateChat", handlePresence);
    return () => socket.off("currentUsersInPrivateChat", handlePresence);
  }, [conversationId, currentUser?._id]);

  // Eventos discretos de entrar/sair (atualiza flags)
  useEffect(() => {
    const handleUserJoined = ({ conversationId: convId, joinedUser }) => {
      if (convId === conversationId && joinedUser?._id !== currentUser?._id) {
        setIsOtherUserInChat(true);
        setHasOtherUserLeft(false);
      }
    };
    const handleUserLeft = ({ conversationId: convId, leftUser }) => {
      if (convId === conversationId && leftUser?._id !== currentUser?._id) {
        setIsOtherUserInChat(false);
        setHasOtherUserLeft(true);
      }
    };
    socket.on("userJoinedPrivateChat", handleUserJoined);
    socket.on("userLeftPrivateChat", handleUserLeft);
    return () => {
      socket.off("userJoinedPrivateChat", handleUserJoined);
      socket.off("userLeftPrivateChat", handleUserLeft);
    };
  }, [conversationId, currentUser?._id]);

  // Auto-scroll ao fim quando chegam novas mensagens
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    socket.emit("sendPrivateMessage", {
      conversationId,
      sender: currentUser._id,
      message: trimmed,
    });
    setMessage("");
  };

  // topo do componente:
return (
  <div className="screenWrapper privateChatPage">
    <Header
      showProfileImage={false}
      navigate={navigate}
      showLeavePrivateRoomButton={true}
      handleLeaveDirectMessagingChat={handleLeaveDirectMessagingChat}
      roomId={conversationId}
    />

    {/* NOVO wrapper para controlar layout em coluna */}
    <div className="privateChatContent">
      {/* área que rola */}
      <div className="messagesScroll" ref={messagesContainerRef}>
        <div className="messagesContainer">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
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

      {/* input fixo no fundo (sticky) */}
      <div className="chatPageInputContainer">
        {!isOtherUserInChat ? (
          <button
            className="inviteBackBtn"
            onClick={() =>
              handleInviteBackToChat(conversationId, currentUser._id)
            }
          >
            Convidar usuário de volta
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  </div>
);

};

export default PrivateChat;
