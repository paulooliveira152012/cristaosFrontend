// src/pages/functions/chatUnifiedFunctions.js
import { useEffect, useMemo, useRef, useState } from "react";

/** Marca como lido ao abrir e quando a aba volta ao foco/visível. */
export function useReadOnOpenAndFocus({
  kind, // 'main' | 'dm'
  id,   // MAIN_ROOM_ID (main) ou conversationId (dm)
  baseURL,
  reset, // fn do UnreadContext
  socket, // (dm) para emitir privateChatRead
  userId, // (dm)
}) {
  useEffect(() => {
    if (!baseURL || !id) return;

    const mark = async () => {
      try {
        if (kind === "main") {
          await fetch(`${baseURL}/api/users/markMainChatAsRead`, {
            method: "POST",
            credentials: "include",
          });
          reset?.(id);
        } else {
          await fetch(`${baseURL}/api/dm/markAsRead/${id}`, {
            method: "POST",
            credentials: "include",
          });
          if (socket && userId) {
            socket.emit("privateChatRead", { conversationId: id, userId });
          }
          reset?.(id);
        }
      } catch {}
    };

    mark();
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") mark();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [kind, id, baseURL, reset, socket, userId]);
}

/** Log opcional de mensagens do main room */
export function useMainNewMessageLog(socket, roomId, onNew = () => {}) {
  useEffect(() => {
    if (!socket || !roomId) return;
    const handler = (payload) => {
      if (payload?.roomId !== roomId) return;
      onNew(payload);
    };
    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
  }, [socket, roomId, onNew]);
}

/**
 * Controller de DM:
 * - busca metadados (participants/pending/leaving)
 * - join/leave (1x por conexão) + histórico (1x por montagem)
 * - marca como lido quando CHEGA nova mensagem (mark initial fica no useReadOnOpenAndFocus)
 * - presença
 * - ações: send / accept / reject / reinvite
 */
export function usePrivateChatController({
  socket,
  conversationId,
  currentUser,
  baseURL,
  reset,               // zera badge; chamado via ref
  inviteBackHandler,   // ({ socket, conversationId, currentUserId })
  onAccepted,          // toast, etc — via ref
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // Estados de UI
  const [otherId, setOtherId] = useState(null);
  const [isOtherParticipant, setIsOtherParticipant] = useState(true);
  const [pendingForMe, setPendingForMe] = useState(false);
  const [waitingOther, setWaitingOther] = useState(false);
  const [isOtherPresent, setIsOtherPresent] = useState(false);

  // 🔒 refs para funções instáveis (não entram nas deps)
  const resetRef = useRef(reset);
  const onAcceptedRef = useRef(onAccepted);
  useEffect(() => { resetRef.current = reset; }, [reset]);
  useEffect(() => { onAcceptedRef.current = onAccepted; }, [onAccepted]);

  // ----- Metadados -----
  useEffect(() => {
    if (!conversationId || !currentUser?._id) return;

    (async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/conversation/${conversationId}`,
          { credentials: "include", headers: { "Cache-Control": "no-cache" } }
        );
        const conv = await res.json();

        const parts = (conv?.participants || []).map((p) => p?._id || p);
        const other =
          parts.find((id) => String(id) !== String(currentUser._id)) || null;
        setOtherId(other);

        let otherStillParticipant = !!other;
        if (conv?.leavingUser && String(conv.leavingUser) === String(other)) {
          otherStillParticipant = false;
        }
        setIsOtherParticipant(otherStillParticipant);

        const pendingArray =
          conv?.pendingFor ||
          conv?.pending ||
          (conv?.pendingUser ? [conv.pendingUser] : []);

        setPendingForMe(
          Array.isArray(pendingArray) &&
            pendingArray.map(String).includes(String(currentUser._id))
        );
        setWaitingOther(
          Array.isArray(pendingArray) && other
            ? pendingArray.map(String).includes(String(other))
            : false
        );
      } catch (e) {
        console.error("Erro ao buscar conversa:", e);
        setIsOtherParticipant(true);
        setPendingForMe(false);
        setWaitingOther(false);
      }
    })();
  }, [conversationId, currentUser?._id, baseURL]);

  // ----- Join + histórico + listeners (sem mark inicial aqui) -----
  useEffect(() => {
    if (!socket || !conversationId || !currentUser?._id) return;
    let mounted = true;

    // garante 1 join por conexão
    const joinedRef = { current: false };
    const join = () => {
      if (joinedRef.current) return;
      socket.emit("joinPrivateChat", { conversationId });
      joinedRef.current = true;
    };
    const onConnect = () => {
      joinedRef.current = false; // permite novo join após reconectar
      join();
    };
    const onDisconnect = () => {
      joinedRef.current = false;
    };

    const handleIncomingMessage = async (newMsg) => {
      if (newMsg?.conversationId !== conversationId || !mounted) return;
      setMessages((prev) =>
        prev.some((m) => m._id === newMsg._id) ? prev : [...prev, newMsg]
      );
      // marca como lido quando chega nova mensagem
      try {
        await fetch(`${baseURL}/api/dm/markAsRead/${conversationId}`, {
          method: "POST",
          credentials: "include",
        });
        socket.emit("privateChatRead", {
          conversationId,
          userId: currentUser._id,
        });
        resetRef.current?.(conversationId);
      } catch {}
    };

    const handleAccepted = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      setPendingForMe(false);
      setWaitingOther(false);
      onAcceptedRef.current?.();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("newPrivateMessage", handleIncomingMessage);
    socket.on("dm:accepted", handleAccepted);

    if (socket.connected) join();

    // histórico — 1x por montagem
    (async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/messages/${conversationId}`,
          { credentials: "include", headers: { "Cache-Control": "no-cache" } }
        );
        const data = await res.json();
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    })();

    return () => {
      mounted = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newPrivateMessage", handleIncomingMessage);
      socket.off("dm:accepted", handleAccepted);
      socket.emit("leavePrivateChat", { conversationId });
    };
  }, [socket, conversationId, currentUser?._id, baseURL]);

  // ----- Presença -----
  useEffect(() => {
    if (!socket || !conversationId || !currentUser?._id) return;

    const handlePresence = ({ conversationId: cid, users }) => {
      if (cid !== conversationId) return;
      const ids = (users || []).map((u) => String(u?._id || u?.userId || u));
      setIsOtherPresent(ids.some((id) => id !== String(currentUser._id)));
    };

    const handleUserJoined = ({ conversationId: cid, joinedUser }) => {
      if (cid !== conversationId) return;
      const id = String(joinedUser?._id || joinedUser?.userId || "");
      if (id && id !== String(currentUser._id)) setIsOtherPresent(true);
    };

    const handleUserLeft = ({ conversationId: cid, leftUser }) => {
      if (cid !== conversationId) return;
      const id = String(leftUser?._id || leftUser?.userId || "");
      if (id && id !== String(currentUser._id)) setIsOtherPresent(false);
    };

    socket.on("currentUsersInPrivateChat", handlePresence);
    socket.on("userJoinedPrivateChat", handleUserJoined);
    socket.on("userLeftPrivateChat", handleUserLeft);

    return () => {
      socket.off("currentUsersInPrivateChat", handlePresence);
      socket.off("userJoinedPrivateChat", handleUserJoined);
      socket.off("userLeftPrivateChat", handleUserLeft);
    };
  }, [socket, conversationId, currentUser?._id]);

  // ----- Ações -----
  const canSend = useMemo(
    () => isOtherParticipant && !pendingForMe && !waitingOther,
    [isOtherParticipant, pendingForMe, waitingOther]
  );

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!socket || !trimmed || !canSend) return;
    socket.emit("sendPrivateMessage", {
      conversationId,
      sender: currentUser._id,
      message: trimmed,
    });
    setMessage("");
  };

  const acceptConversation = async () => {
    try {
      const res = await fetch(`${baseURL}/api/dm/accept`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      if (!res.ok) throw new Error("Erro ao aceitar conversa");
      setPendingForMe(false);
      setWaitingOther(false);
      onAcceptedRef.current?.();
    } catch (e) {
      console.error("Erro ao aceitar conversa:", e);
    }
  };

  const rejectConversation = async () => {
    try {
      await fetch(`${baseURL}/api/dm/rejectChatRequest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
    } catch (e) {
      console.error("Erro ao rejeitar conversa:", e);
    }
  };

  const reinviteConversation = () => {
    inviteBackHandler?.({
      socket,
      conversationId,
      currentUserId: currentUser._id,
    });
    setWaitingOther(true);
  };

  return {
    messages,
    message,
    setMessage,
    sendMessage,

    isOtherParticipant,
    pendingForMe,
    waitingOther,
    isOtherPresent,
    otherId,
    canSend,

    acceptConversation,
    rejectConversation,
    reinviteConversation,
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

/** Helper visual (mesmo do ChatComponent) */
export const getRandomDarkColor = () => {
  const r = Math.floor(Math.random() * 150);
  const g = Math.floor(Math.random() * 150);
  const b = Math.floor(Math.random() * 150);
  return `rgb(${r}, ${g}, ${b})`;
};
