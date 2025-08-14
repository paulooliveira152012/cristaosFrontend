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
} from "../components/functions/headerFunctions";

const PrivateChat = () => {
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);
  const [isOtherParticipant, setIsOtherParticipant] = useState(false); // DB
  const [isOtherPresent, setIsOtherPresent] = useState(false); // socket (opcional)

  console.log("isOtherParticipant", isOtherParticipant);

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const refreshParticipantsFromDB = async () => {
    try {
      const res = await fetch(
        `${baseURL}/api/dm/conversation/${conversationId}`,
        {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" }, // evita cache
        }
      );
      if (!res.ok) {
        // conversa pode ter sido apagada ou ainda não persistiu a alteração
        setIsOtherParticipant(false);
        return;
      }
      const conv = await res.json();

      // normaliza tudo para string
      const me = String(currentUser._id);
      const parts = (conv?.participants ?? []).map((p) => String(p?._id ?? p));
      const others = parts.filter((id) => id !== me);

      // regra simples: se só tem você => false
      setIsOtherParticipant(others.length > 0);
    } catch (e) {
      console.error("Erro ao buscar conversa:", e);
      // não force true; melhor false (ou manter estado anterior)
      setIsOtherParticipant(false);
    }
  };

  useEffect(() => {
    if (!conversationId || !currentUser) return;
    refreshParticipantsFromDB();
  }, [conversationId, currentUser?._id]);

  // Join + listener de nova mensagem + fetch inicial + markAsRead
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
    // Entrar na sala (sem acumular listeners)
    const join = () => {
      socket.emit("joinPrivateChat", {
        conversationId,
        userId: currentUser._id,
      });
    };

    // garante que não tem handler duplicado para 'connect'
    socket.off("connect", join);
    if (socket.connected) join();
    socket.on("connect", join);

    // Listener para novas mensagens
    socket.off("newPrivateMessage", handleIncomingMessage);
    socket.on("newPrivateMessage", handleIncomingMessage);

    // Carrega histórico
    (async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/messages/${conversationId}`,
          {
            credentials: "include",
          }
        );
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
      socket.off("connect", join);
    };
  }, [conversationId, currentUser?._id, baseURL]);

  // Presença em tempo real (lista completa dos presentes)
  useEffect(() => {
    const handlePresence = ({ conversationId: convId, users }) => {
      if (convId !== conversationId) return;
      const others = (users || []).filter((u) => u?._id !== currentUser?._id);
      setIsOtherPresent(others.length > 0);
    };
    socket.on("currentUsersInPrivateChat", handlePresence);
    return () => socket.off("currentUsersInPrivateChat", handlePresence);
  }, [conversationId, currentUser?._id]);

  // Eventos discretos de entrar/sair (atualiza flags)
  useEffect(() => {
    const handleUserJoined = ({ conversationId: convId, joinedUser }) => {
      if (convId === conversationId && joinedUser?._id !== currentUser?._id) {
        setIsOtherPresent(true); // só presença
      }
    };
    const handleUserLeft = ({ conversationId: convId, leftUser }) => {
      if (convId === conversationId && leftUser?._id !== currentUser?._id) {
        setIsOtherPresent(false); // só presença
      }
    };
    socket.on("userJoinedPrivateChat", handleUserJoined);
    socket.on("userLeftPrivateChat", handleUserLeft);
    return () => {
      socket.off("userJoinedPrivateChat", handleUserJoined);
      socket.off("userLeftPrivateChat", handleUserLeft);
    };
  }, [conversationId, currentUser?._id]);

  // Atualizar automaticamente quando o servidor mudar de participante
  useEffect(() => {
    const onParticipantChanged = ({
      conversationId: cid,
      participants = [],
      removedUserId,
    }) => {
      if (cid !== conversationId) return;

      // Se a lista de participantes recebida não contém o "outro", bloqueia já
      if (Array.isArray(participants) && participants.length) {
        const me = String(currentUser._id);
        const norm = participants.map(String);
        const others = norm.filter((id) => id !== me);
        setIsOtherParticipant(others.length > 0);
      } else if (
        removedUserId &&
        String(removedUserId) !== String(currentUser._id)
      ) {
        // se o servidor informou quem saiu (e não fui eu), bloqueia já
        setIsOtherParticipant(false);
      }

      // Atualiza do DB em background só para confirmar
      refreshParticipantsFromDB();
    };

    socket.on("dm:participantChanged", onParticipantChanged);
    return () => socket.off("dm:participantChanged", onParticipantChanged);
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
    if (!isOtherParticipant) return; // bloqueia pelo estado local também
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
          {!isOtherParticipant ? (
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
