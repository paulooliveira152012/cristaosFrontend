// utils/chatComponentFunctions.js (JS puro, compatível com o novo contexto)
// ✅ Sem import de useSocket aqui — o socket vem por parâmetro
import React, { useEffect } from "react";

// Nomes de eventos (ajuste se seu back usar outros)
const MAIN_CHAT_NEW_MESSAGE_EVENT = "newMessage";
const ROOM_CHAT_HISTORY_EVENT = "chatHistory";
const ROOM_CHAT_JOIN_EVENT = "joinRoomChat";
// No seu back, para chat comum, o LEAVE real é "leaveRoom". Use este para evitar sala zumbi:
const ROOM_CHAT_LEAVE_EVENT = "leaveRoom";

/* =========================
   HOOKS (recebem socket)
   ========================= */

export const useSocketConnectionLogger = (socket) => {
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const onConnect = () => console.log("✅ Socket connected:", socket.id);
    const onDisconnect = (r) => console.warn("❌ Socket disconnected:", r);
    const onError = (e) => console.error("⛔ connect_error:", e?.message || e);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [socket]);
};

export const useJoinRoomChat = (
  socket,
  roomId,
  currentUser,
  setMessages,
  scrollToBottom
) => {
  useEffect(() => {
    if (!socket || typeof socket.emit !== "function") return;
    if (!roomId || !currentUser || !currentUser._id) return;

    // entrar e pedir histórico
    socket.emit(ROOM_CHAT_JOIN_EVENT, { roomId, user: currentUser });
    socket.emit("requestChatHistory", { roomId });

    const handleChatHistory = (history) => {
      const list = Array.isArray(history) ? history : history?.messages;
      const hid = history?.roomId;
      if (hid && roomId && hid !== roomId) return;
      setMessages(Array.isArray(list) ? list : []);
      if (typeof scrollToBottom === "function") scrollToBottom(); // chama sem args
    };

    socket.on(ROOM_CHAT_HISTORY_EVENT, handleChatHistory);

    return () => {
      socket.emit(ROOM_CHAT_LEAVE_EVENT, { roomId }); // "leaveRoom" no seu back
      socket.off(ROOM_CHAT_HISTORY_EVENT, handleChatHistory);
    };
  }, [
    socket,
    roomId,
    currentUser && currentUser._id,
    setMessages,
    scrollToBottom,
  ]);
};

export const useReceiveMessage = (socket, setMessages, roomId) => {
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const handleReceiveMessage = (newMessage) => {
      if (roomId && newMessage?.roomId && newMessage.roomId !== roomId) return;
      setMessages((prev) => [...prev, newMessage]);
    };

    socket.on(MAIN_CHAT_NEW_MESSAGE_EVENT, handleReceiveMessage);
    // Se seu back também emite outros nomes, adicione aqui:
    // socket.on("message:created", handleReceiveMessage);

    return () => {
      socket.off(MAIN_CHAT_NEW_MESSAGE_EVENT, handleReceiveMessage);
      // socket.off("message:created", handleReceiveMessage);
    };
  }, [socket, setMessages, roomId]);
};

export const useListenMessageDeleted = (socket, roomId, setMessages) => {
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const handleDelete = (payload) => {
      // Pode vir como { messageId, roomId } ou direto como id
      const messageId =
        typeof payload === "string" ? payload : payload?.messageId;
      if (!messageId) return;
      setMessages((prev) =>
        prev.filter((msg) => String(msg._id) !== String(messageId))
      );
    };

    socket.on("messageDeleted", handleDelete);
    // compat: socket.on("deleteMessage", handleDelete);

    return () => {
      socket.off("messageDeleted", handleDelete);
      // socket.off("deleteMessage", handleDelete);
    };
  }, [socket, roomId, setMessages]);
};

export const useAutoScrollToBottom = (messages, isAtBottom, scrollToBottom) => {
  useEffect(() => {
    if (isAtBottom && typeof scrollToBottom === "function") {
      const id = requestAnimationFrame(scrollToBottom);
      return () => cancelAnimationFrame(id);
    }
  }, [messages, isAtBottom, scrollToBottom]);
};

/* =========================
   FUNÇÕES UTILITÁRIAS
   ========================= */

export const sendMessageUtil = ({
  socket, // obrigatório
  currentUser,
  message,
  roomId,
  setMessage,
  scrollToBottom,
  inputRef,
}) => {
  if (!socket || typeof socket.emit !== "function") return;
  if (!currentUser || !currentUser._id) {
    alert("Please log in to send messages");
    return;
  }
  if (!message || !message.trim()) return;

  const newMessage = {
    userId: currentUser._id,
    username: currentUser.username,
    profileImage: currentUser.profileImage || "",
    message,
    roomId,
    timestamp: new Date(),
  };

  socket.emit("sendMessage", newMessage);

  setMessage("");
  if (typeof scrollToBottom === "function") scrollToBottom();
  if (
    inputRef &&
    inputRef.current &&
    typeof inputRef.current.focus === "function"
  ) {
    inputRef.current.focus();
  }
};

export const handleDeleteMessageUtil = ({
  socket,
  messageId,
  currentUser,
  roomId,
}) => {
  if (!socket || typeof socket.emit !== "function") return;
  if (!currentUser || !currentUser._id) return;
  if (!messageId) return;

  socket.emit("deleteMessage", {
    messageId,
    userId: currentUser._id,
    roomId,
  });
};

export const handleToggleMicrophoneUtil = async ({
  socket, // obrigatório
  micState,
  toggleMicrophone,
  roomId,
  currentUser,
}) => {
  if (!socket || typeof socket.emit !== "function") return;
  if (!currentUser || !currentUser._id) return;
  try {
    const newMicState = !micState;
    await toggleMicrophone(newMicState);
    socket.emit("toggleMicrophone", {
      roomId,
      userId: currentUser._id,
      micOpen: newMicState,
    });
  } catch (error) {
    console.error("Error toggling microphone:", error);
  }
};

/* =========================
   Helpers visuais
   ========================= */

export const getRandomDarkColor = () => {
  const r = Math.floor(Math.random() * 150);
  const g = Math.floor(Math.random() * 150);
  const b = Math.floor(Math.random() * 150);
  return `rgb(${r}, ${g}, ${b})`;
};

export const handleScrollUtil = (ref, setIsAtBottom) => {
  const el = ref && ref.current;
  if (!el) return;
  const threshold = 20;
  const atBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  setIsAtBottom(Boolean(atBottom));
};

export const scrollToBottomUtil = (ref, smooth = true) => {
  const el = ref && ref.current;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
};
