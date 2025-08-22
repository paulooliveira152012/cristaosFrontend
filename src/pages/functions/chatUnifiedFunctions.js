// src/pages/functions/chatUnifiedFunctions.js
import { useEffect, useMemo, useRef, useState } from "react";

/** Marca como lido ao abrir e quando a aba volta ao foco/visível. */
export function useReadOnOpenAndFocus({
  kind, // 'main' | 'dm'
  id, // MAIN_ROOM_ID (main) ou conversationId (dm)
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
  reset, // zera badge; chamado via ref
  inviteBackHandler, // ({ socket, conversationId, currentUserId })
  onAccepted, // toast, etc — via ref
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const suppressLeaveUntilRef = useRef(0);

  // Estados de UI
  const [otherId, setOtherId] = useState(null);
  const [isOtherParticipant, setIsOtherParticipant] = useState(true);
  const [pendingForMe, setPendingForMe] = useState(false);
  const [waitingOther, setWaitingOther] = useState(false);
  const [isOtherPresent, setIsOtherPresent] = useState(false);

  // 🔒 refs para funções instáveis (não entram nas deps)
  const resetRef = useRef(reset);
  const onAcceptedRef = useRef(onAccepted);
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);
  useEffect(() => {
    onAcceptedRef.current = onAccepted;
  }, [onAccepted]);

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

          const myId = String(currentUser._id);
      const parts  = (conv?.participants || []).map((p) => String(p?._id || p));
      const waiting = conv?.waitingUser ? String(conv.waitingUser) : null;
      const requester = conv?.requester ? String(conv.requester) : null;
      // se há alguém além de mim nos participants, o "outro" participa
      const othersInParticipants = parts.filter((id) => id !== myId);
      setIsOtherParticipant(othersInParticipants.length > 0);
      // pendências derivadas de waitingUser
      setPendingForMe(waiting === myId);
      setWaitingOther(!!waiting && waiting !== myId);
      // inferir o id do "outro": participante existente ou o waitingUser / requester
      const inferredOther =
        othersInParticipants[0] ||
        (waiting === myId ? requester : waiting) ||
        null;
      setOtherId(inferredOther);
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

    // garante 1 join por conexão
    const join = () => {
      if (joinedRef.current) return;
      socket.emit("joinPrivateChat", { conversationId });
      joinedRef.current = true;
    };

    // trata reconexões
    const onConnect = () => {
      joinedRef.current = false; // permite novo join após reconectar
      join();
    };

    // trata desconexões
    const onDisconnect = () => {
      joinedRef.current = false;
    };

    // trata mensagens recebidas
    const handleIncomingMessage = async (newMsg) => {
      if (!mounted) return;

      const msgConvId = String(
        newMsg?.conversationId ?? newMsg?.conversation ?? ""
      );
      if (msgConvId !== String(conversationId)) return;

      // Guard: só renderizamos sistemas persistidos (com _id)
      if (
        (newMsg?.type === "system" || newMsg?.isSystem || newMsg?.eventType) &&
        !newMsg?._id
      ) {
        return;
      }

      setMessages((prev) => {
        const has = prev.some((m) => String(m._id) === String(newMsg._id));
        return has ? prev : [...prev, newMsg];
      });

      try {
        await fetch(`${baseURL}/api/dm/markAsRead/${conversationId}`, {
          method: "POST",
          credentials: "include",
        });
        socket.emit("privateChatRead", {
          conversationId: String(conversationId),
          userId: currentUser._id,
        });
        resetRef.current?.(conversationId);
      } catch {}
    };

    // trata aceitação de DM
    const handleAccepted = ({ conversationId: cid }) => {
      if (String(cid) !== String(conversationId)) return;

      // libere envio/estados DENTRO do hook
      setPendingForMe(false);
      setWaitingOther(false);
      setIsOtherParticipant(true); // garante canSend => true pelo useMemo

      // evite "saiu" fantasma por ~1.5s
      suppressLeaveUntilRef.current = Date.now() + 1500;

      // system "join" local (quem chamou vê que o outro entrou)
      // setMessages((prev) =>
      //   prev.concat([
      //     {
      //       _id: `sys-join-${Date.now()}`,
      //       type: "system",
      //       eventType: "join",
      //       message: "Usuário entrou na conversa",
      //       timestamp: Date.now(),
      //     },
      //   ])
      // );

      // garante presença no room
      socket.emit("joinPrivateChat", { conversationId });

      onAcceptedRef.current?.();
    };

    // trata reconexões
    socket.on("connect", onConnect);
    // trata desconexões
    socket.on("disconnect", onDisconnect);
    // trata mensagens recebidas
    socket.on("newPrivateMessage", handleIncomingMessage);
    // trata aceitação de DM
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

    // trata mudanças de participantes
    const handleParticipantChanged = ({
      conversationId: cid,
      participants,
      waitingUser,
    }) => {
      if (String(cid) !== String(conversationId)) return;

      const myId = String(currentUser._id);
      const others = (participants || [])
        .map(String)
        .filter((id) => id !== myId);

      // se tem “outro” na lista, ele participa; se não, saiu
      setIsOtherParticipant(others.length > 0);

      // pendências
      setPendingForMe(waitingUser ? String(waitingUser) === myId : false);
      setWaitingOther(waitingUser ? String(waitingUser) !== myId : false);
    };

   const handleRejected = ({ conversationId: cid }) => {
    if (String(cid) !== String(conversationId)) return;
    // Estado seguro pós-rejeição para atualizar a UI imediatamente
    setWaitingOther(false);
    setPendingForMe(false);
    setIsOtherParticipant(false);
  };

    socket.on("dm:participantChanged", handleParticipantChanged);
    socket.on("dm:rejected", handleRejected);

    return () => {
      mounted = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newPrivateMessage", handleIncomingMessage);
      socket.off("dm:accepted", handleAccepted);
      socket.off("dm:participantChanged", handleParticipantChanged);
       socket.off("dm:rejected", handleRejected);

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
      if (String(cid) !== String(conversationId)) return;
      const id = String(joinedUser?._id || joinedUser?.userId || "");
      if (id && id !== String(currentUser._id)) {
        setIsOtherPresent(true);

        // dá um pequeno guarda pra suprimir "left" de reconexão
        suppressLeaveUntilRef.current = Date.now() + 1500;
        // setMessages((prev) =>
        //   prev.concat([
        //     {
        //       _id: `sys-join-${Date.now()}`,
        //       type: "system",
        //       eventType: "join",
        //       message: `${
        //         joinedUser?.username || "Usuário"
        //       } entrou na conversa`,
        //       timestamp: Date.now(),
        //     },
        //   ])
        // );
      }
    };

    const handleUserLeft = ({ conversationId: cid /*, leftUser*/ }) => {
      if (String(cid) !== String(conversationId)) return;
      if (Date.now() < suppressLeaveUntilRef.current) return; // evita “fantasma”
      setIsOtherPresent(false);
      // não empurre mensagem aqui — ela virá do backend via newPrivateMessage
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
