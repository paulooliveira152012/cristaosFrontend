// src/pages/PrivateChat.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";


import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";
import {
  handleLeaveDirectMessagingChat,
  handleInviteBackToChat,
} from "../components/functions/headerFunctions";
import { deriveDmState } from "../utils/dmState";

const PrivateChat = () => {
  const socket = useSocket();
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);

  // estado canônico do DM
  const [meta, setMeta] = useState({
    participants: [], // [string]
    waitingUser: null, // string|null
    requester: null, // string|null
    leavingUser: null, // string|null
  });

  const toStr = (x) =>
    x && x._id ? String(x._id) : x != null ? String(x) : null;

  // Descobrir "o outro" sem usar pendingFor
  const getOtherId = () => {
    const me = String(currentUser?._id || "");
    const bag = new Set(
      [
        ...(meta.participants || []),
        meta.waitingUser,
        meta.requester,
        meta.leavingUser,
      ]
        .filter(Boolean)
        .map(String)
    );
    bag.delete(me);
    for (const id of bag) return id;
    return null;
  };

  // Carregar meta do DB
  const refreshFromDB = async () => {
    try {
      const res = await fetch(
        `${baseURL}/api/dm/conversation/${conversationId}`,
        {
          credentials: "include",
          headers: { "Cache-Control": "no-cache" },
        }
      );
      if (!res.ok) return;
      const conv = await res.json();
      setMeta({
        participants: (conv?.participants || []).map(toStr),
        waitingUser: toStr(conv?.waitingUser),
        requester: toStr(conv?.requester),
        leavingUser: toStr(conv?.leavingUser),
      });
    } catch (e) {
      console.error("Erro ao buscar conversa:", e);
    }
  };

  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;
    refreshFromDB();
  }, [conversationId, currentUser?._id]);

  // Join + mensagens + markAsRead
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    const handleIncomingMessage = (newMsg) => {
      if (newMsg?.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg]
      );
    };

    const join = () => {
      socket.emit("joinPrivateChat", {
        conversationId,
        userId: currentUser._id,
      });
    };

    socket.off("connect", join);
    if (socket.connected) join();
    socket.on("connect", join);

    socket.off("newPrivateMessage", handleIncomingMessage);
    socket.on("newPrivateMessage", handleIncomingMessage);

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

    return () => {
      socket.off("newPrivateMessage", handleIncomingMessage);
      socket.off("connect", join);
    };
  }, [conversationId, currentUser?._id, baseURL]);

  // Atualizações em tempo real
  useEffect(() => {
    const onParticipantChanged = (p) => {
      if (p?.conversationId !== conversationId) return;
      setMeta((prev) => ({
        participants: (p.participants ?? prev.participants ?? []).map(toStr),
        waitingUser: toStr(
          p.waitingUser != null ? p.waitingUser : prev.waitingUser
        ),
        requester: toStr(p.requester != null ? p.requester : prev.requester),
        leavingUser: toStr(
          p.leavingUser != null ? p.leavingUser : prev.leavingUser
        ),
      }));
      // opcional: confirmar com o DB
      // refreshFromDB();
    };
    socket.on("dm:participantChanged", onParticipantChanged);
    return () => socket.off("dm:participantChanged", onParticipantChanged);
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Ações simples (se você criou rotas /accept e /reject)
  const accept = async () => {
    try {
      await fetch(`${baseURL}/api/dm/accept`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    } catch (e) {
      console.error("accept erro:", e);
    }
  };

  const reject = async () => {
    try {
      await fetch(`${baseURL}/api/dm/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      navigate("/chat");
    } catch (e) {
      console.error("reject erro:", e);
    }
  };

  // Enviar msg (só se ACTIVE)
  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const uiState = deriveDmState(
      currentUser?._id,
      meta.participants,
      meta.waitingUser,
      meta.requester,
      meta.leavingUser
    );
    if (uiState !== "ACTIVE") return;

    socket.emit("sendPrivateMessage", {
      conversationId,
      sender: currentUser._id,
      message: trimmed,
    });
    setMessage("");
  };

  // Estado de UI (ASSINATURA NOVA!)
  const uiState = deriveDmState(
    currentUser?._id,
    meta.participants,
    meta.waitingUser,
    meta.requester,
    meta.leavingUser
  );

  return (
    <div className="screenWrapper privateChatPage">
      <Header
        showProfileImage={false}
        navigate={navigate}
        showLeavePrivateRoomButton={true}
        handleLeaveDirectMessagingChat={handleLeaveDirectMessagingChat}
        roomId={conversationId}
      />

      <div className="privateChatContent">
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

        <div className="chatPageInputContainer">
          {uiState === "ACTIVE" && (
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

          {uiState === "PENDING_ME_WAITING_OTHER" && (
            <button className="inviteBackBtn" disabled>
              Aguardando usuário aceitar a conversa…
            </button>
          )}

          {uiState === "PENDING_I_NEED_TO_ACCEPT" && (
            <>
              <button className="sendBtn" onClick={accept}>
                Aceitar conversa
              </button>
              <button className="inviteBackBtn" onClick={reject}>
                Rejeitar
              </button>
            </>
          )}

          {uiState === "ALONE_CAN_REINVITE" && (
            <button
              className="inviteBackBtn"
              onClick={() =>
                handleInviteBackToChat(conversationId, currentUser._id)
              }
            >
              Convidar usuário de volta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;
