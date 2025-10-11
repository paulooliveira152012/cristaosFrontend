// utils/chatComponentFunctions.js
import { useEffect } from "react";
import { useSocket } from "../../context/SocketContext";
import { authHeaders } from "../../utils/AuthHeaders"

// ---------------------------
// HOOKS (ok usar useSocket)
// ---------------------------
export const useSocketConnectionLogger = () => {
  const { socket } = useSocket(); // ✅ desestruturação
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const onConnect = () => console.log("Socket connected:", socket.id);
    const onDisconnect = () => console.log("Socket disconnected");
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);
};

export const useJoinRoomChat = (roomId, currentUser, setMessages, scrollToBottom) => {
  const { socket } = useSocket(); // ✅
  useEffect(() => {
    if (!socket || typeof socket.emit !== "function") return;
    if (!roomId || !currentUser) return;

    socket.emit("joinRoomChat", { roomId, user: currentUser });
    socket.emit("requestChatHistory", { roomId });

    const handleChatHistory = (history) => {
      setMessages(history || []);
      scrollToBottom(false);
    };

    socket.on("chatHistory", handleChatHistory);

    return () => {
      if (typeof socket.emit === "function") {
        socket.emit("leaveRoomChat", { roomId });
      }
      socket.off("chatHistory", handleChatHistory);
    };
  }, [socket, roomId, currentUser, setMessages, scrollToBottom]);
};

export const useReceiveMessage = (setMessages) => {
  const { socket } = useSocket(); // ✅
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const handleReceiveMessage = (newMessage) =>
      setMessages((prev) => [...prev, newMessage]);
    // alinhe com o nome que o back emite
    socket.on("newMessage", handleReceiveMessage);
    return () => socket.off("newMessage", handleReceiveMessage);
  }, [socket, setMessages]);
};

export const useListenMessageDeleted = (roomId, setMessages) => {
  const { socket } = useSocket(); // ✅
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const handleDelete = (messageId) =>
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    socket.on("messageDeleted", handleDelete);
    return () => socket.off("messageDeleted", handleDelete);
  }, [socket, roomId, setMessages]);
};

export const useAutoScrollToBottom = (messages, isAtBottom, scrollToBottom) => {
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom, scrollToBottom]);
};

// ---------------------------
// FUNÇÕES UTILITÁRIAS
// ---------------------------
const baseURL = process.env.REACT_APP_API_BASE_URL;

// Melhor: limpar cookie no back e derrubar o socket aqui
export const handleLogout = async (logout, navigate, socket) => {
  try {
    await fetch(`${baseURL}/api/users/signout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignora falha de rede
  }
  if (socket && typeof socket.disconnect === "function") {
    socket.disconnect();
  }
  // opcional: disparar "auth event" pros listeners em outras abas
  try { localStorage.removeItem("auth: event", String(Date.now())); } catch {}
  logout();
  navigate("/");
};

export const handleBack = (
  navigate, 
  socket, 
  roomId, 
  _userId, 
  _minimizeRoom, 
  _sala, 
  isRejoiningRef, 
  microphoneOn) => {
  if (!roomId) return navigate("/");
  if (!socket || !socket.connected || typeof socket.emit !== "function") {
    console.warn("handleBack: socket indisponível, navegando sem emitir");
    return navigate("/");
  }
  socket.emit("backFromRoom", { roomId, microphoneOn: !!microphoneOn }, (ack) => {
    if (ack?.action === "minimized" && isRejoiningRef && "current" in isRejoiningRef) {
      isRejoiningRef.current = true;
    }
    navigate("/");
  });
};





export const handleLeaveDirectMessagingChat = async ({
  socket,              // ✅ vem de fora
  conversationId,
  userId,
  username,
  navigate,
}) => {
  console.log("leaving private message")
  try {
    const res = await fetch(
      `${baseURL}/api/dm/leaveChat/${conversationId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );
    if (!res.ok) throw new Error("Erro ao sair da conversa");
    socket?.emit?.("leavePrivateChat", { conversationId, userId, username });
    navigate("/");
  } catch (err) {
    console.error("Erro ao sair da conversa:", err);
  }
};

export const handleInviteBackToChat = async ({
  socket,              // ✅ vem de fora
  conversationId,
  currentUserId,
}) => {
  try {
    const res = await fetch(`${baseURL}/api/dm/reinvite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ conversationId, currentUserId }),
    });
    const data = await res.json();
    const toUserId = data?.toUserId;
    if (!res.ok || !toUserId) throw new Error("Erro ao reinserir usuário");

    socket?.emit?.("inviteUserBackToPrivateChat", {
      conversationId,
      fromUser: { _id: currentUserId },
      toUser: { _id: toUserId },
    });

    alert("Convite enviado com sucesso!");
  } catch (err) {
    console.error("Erro ao convidar de volta:", err);
  }
};

export const handleFetchRoomMembers = async (id, setIsOtherUserInChat) => {
  try {
    const res = await fetch(`${baseURL}/api/dm/usersInChat/${id}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (Array.isArray(data?.users) && data.users.length > 0) {
      setIsOtherUserInChat(true);
    }
    return data;
  } catch (error) {
    console.error("Erro ao buscar usuários na sala:", error);
    return null;
  }
};
