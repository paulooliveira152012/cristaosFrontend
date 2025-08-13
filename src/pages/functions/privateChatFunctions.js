// Ajuste o caminho se sua pasta for diferente
import { useEffect, useMemo, useState } from "react";
import socket from "../../socket"; // ← de components/functions até /src/socket

/**
 * Hook controlador do fluxo de DM:
 * - busca metadados da conversa (participants, pendingFor, leavingUser)
 * - entra na sala e escuta mensagens em tempo real
 * - presença (userJoined/userLeft/currentUsersInPrivateChat)
 * - marcar como lido
 * - ações: enviar, aceitar, reinvitar
 */
export function usePrivateChatController({
  conversationId,
  currentUser,
  baseURL,
  inviteBackHandler,   // ex.: handleInviteBackToChat
  onAccepted,          // opcional (toast, etc)
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // Estados de UI
  const [otherId, setOtherId] = useState(null);
  const [isOtherParticipant, setIsOtherParticipant] = useState(true); // DB
  const [pendingForMe, setPendingForMe] = useState(false);            // convite → eu preciso aceitar?
  const [waitingOther, setWaitingOther] = useState(false);            // convite → o outro precisa aceitar?
  const [isOtherPresent, setIsOtherPresent] = useState(false);        // socket (online)

  // ----- Carrega metadados da conversa (participants/pending/leaving) -----
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    (async () => {
      try {
        const res = await fetch(`${baseURL}/api/dm/conversation/${conversationId}`, {
          credentials: "include",
        });
        const conv = await res.json();

        // participants pode vir como array de IDs ou objetos
        const parts = (conv?.participants || []).map((p) => p?._id || p);
        const other = parts.find((id) => id !== currentUser._id) || null;
        setOtherId(other);

        // continua participante se “other” ainda está no array
        let otherStillParticipant = !!other;
        if (conv?.leavingUser && conv.leavingUser === other) {
          otherStillParticipant = false;
        }
        setIsOtherParticipant(otherStillParticipant);

        // pending pode vir como pendingFor, pending, ou pendingUser
        const pendingArray =
          conv?.pendingFor ||
          conv?.pending ||
          (conv?.pendingUser ? [conv.pendingUser] : []);

        setPendingForMe(Array.isArray(pendingArray) && pendingArray.includes(currentUser._id));
        setWaitingOther(Array.isArray(pendingArray) && other ? pendingArray.includes(other) : false);
      } catch (e) {
        console.error("Erro ao buscar conversa:", e);
        // fallback seguro: deixa conversar
        setIsOtherParticipant(true);
        setPendingForMe(false);
        setWaitingOther(false);
      }
    })();
  }, [conversationId, currentUser?._id, baseURL]);

  // ----- Join/rejoin + mensagens em tempo real + histórico + markAsRead -----
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    const handleIncomingMessage = (newMsg) => {
      if (newMsg?.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg]));
    };

    const handleAccepted = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      setPendingForMe(false);
      setWaitingOther(false);
      onAccepted?.();
    };

    const join = () =>
      socket.emit("joinPrivateChat", { conversationId, userId: currentUser._id });

    if (socket.connected) join();
    socket.on("connect", join);

    socket.on("newPrivateMessage", handleIncomingMessage);
    socket.on("dm:accepted", handleAccepted);

    // histórico
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

    // marcar como lido
    (async () => {
      try {
        await fetch(`${baseURL}/api/dm/markAsRead/${conversationId}`, {
          method: "POST",
          credentials: "include",
        });
        socket.emit("privateChatRead", { conversationId, userId: currentUser._id });
      } catch (err) {
        console.error("Erro ao marcar como lida:", err);
      }
    })();

    return () => {
      socket.off("newPrivateMessage", handleIncomingMessage);
      socket.off("dm:accepted", handleAccepted);
      socket.off("connect", join);
      socket.emit("leavePrivateChat", { conversationId, userId: currentUser._id });
    };
  }, [conversationId, currentUser?._id, baseURL, onAccepted]);

  // ----- Presença (online/offline) – apenas informativo -----
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    const handlePresence = ({ conversationId: cid, users }) => {
      if (cid !== conversationId) return;
      const others = (users || []).filter((u) => u?._id !== currentUser._id);
      setIsOtherPresent(others.length > 0);
    };
    const handleUserJoined = ({ conversationId: cid, joinedUser }) => {
      if (cid === conversationId && joinedUser?._id !== currentUser._id) setIsOtherPresent(true);
    };
    const handleUserLeft = ({ conversationId: cid, leftUser }) => {
      if (cid === conversationId && leftUser?._id !== currentUser._id) setIsOtherPresent(false);
    };

    socket.on("currentUsersInPrivateChat", handlePresence);
    socket.on("userJoinedPrivateChat", handleUserJoined);
    socket.on("userLeftPrivateChat", handleUserLeft);

    return () => {
      socket.off("currentUsersInPrivateChat", handlePresence);
      socket.off("userJoinedPrivateChat", handleUserJoined);
      socket.off("userLeftPrivateChat", handleUserLeft);
    };
  }, [conversationId, currentUser?._id]);

  // ----- Ações -----
  const canSend = useMemo(
    () => isOtherParticipant && !pendingForMe && !waitingOther,
    [isOtherParticipant, pendingForMe, waitingOther]
  );

  const send = () => {
    const trimmed = message.trim();
    if (!trimmed || !canSend) return;
    socket.emit("sendPrivateMessage", {
      conversationId,
      sender: currentUser._id,
      message: trimmed,
    });
    setMessage("");
  };

  const accept = async () => {
    try {
      await fetch(`${baseURL}/api/dm/accept/${conversationId}`, {
        method: "POST",
        credentials: "include",
      });
      setPendingForMe(false);
      setWaitingOther(false);
      socket.emit("dm:accepted", { conversationId });
      onAccepted?.();
    } catch (e) {
      console.error("Erro ao aceitar conversa:", e);
    }
  };

  const reinvite = () => {
    inviteBackHandler?.(conversationId, currentUser._id);
    // após reinvitar, o outro fica pendente
    setWaitingOther(true);
  };

  return {
    // mensagens e input
    messages,
    message,
    setMessage,
    sendMessage: send,

    // estados de UI
    isOtherParticipant,
    pendingForMe,
    waitingOther,
    isOtherPresent,
    otherId,

    // ações
    acceptConversation: accept,
    reinviteConversation: reinvite,
    canSend,
  };
}

/** Auto-scroll para o fim quando a lista muda */
export function useAutoScrollToBottom(ref, deps) {
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, deps); // normalmente [messages]
}
