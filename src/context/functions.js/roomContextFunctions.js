import { authHeaders } from "../../utils/AuthHeaders";
// --- Events centralizados ---
export const EV = {
  CHAT_JOIN: "joinRoomChat",
  CHAT_LEAVE: "leaveRoomChat",
  CHAT_HISTORY_REQ: "requestChatHistory",
  CHAT_HISTORY: "chatHistory",
  CHAT_SEND: "sendMessage",       // server ESCUTA
  CHAT_MSG: "chat:message",       // server BROADCASTA
  CHAT_DELETE_REQ: "deleteMessage",
  CHAT_DELETE: "messageDeleted",
};

// ---------- REST helpers já existentes ----------

// ================================================================
// 1 Fetch room data
// ================================================================
// roomContextFunctions.js
// roomContextFunctions.js
export async function fetchRoomData({ roomId, baseUrl, setIsRoomReady, setRoom, setCanStartRoom }) {
  if (!roomId || !baseUrl) return null;
  console.log("2 - fetchRoomData")

  const res = await fetch(`${baseUrl}/api/rooms/fetchRoomData/${roomId}`, {
    method: "GET",
    credentials: "include",               // envia cookies
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    let msg = "Erro ao buscar sala";
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  setIsRoomReady(true)
  setRoom(data)
  // Monte a lista de IDs autorizados (criador + admins)
  const creatorId = typeof data?.createdBy === "string" ? data.createdBy : data?.createdBy?._id;
  const adminIds = Array.isArray(data?.admins)
   ? data.admins.map(a => (typeof a === "string" ? a : a?._id)).filter(Boolean)
   : [];
   const uniqueIds = Array.from(new Set([creatorId, ...adminIds].filter(Boolean)));
   setCanStartRoom?.(uniqueIds)
  return { data };
}

// ================================================================
// 2 Fetch room messages
// ================================================================

// roomChatApi.js
// Se usar JWT em header, passe authHeaders (objeto ou função que retorna objeto)
// Se usar cookie de sessão, basta credentials: "include" e pode omitir authHeaders
export async function loadRoomMessages({ roomId, baseUrl, setMessages, authHeaders, setAreMessagesReady }) {
  console.log("4 - loadRoomMessages")
  if (!roomId || !baseUrl || !setMessages) {
    console.log(`🚨 missing roomId: ${roomId} or baseUrl: ${baseUrl}, or setMessages: ${setMessages}`)
    return;
  } 

  try {
    const ah = typeof authHeaders === "function" ? authHeaders() : authHeaders;

    const res = await fetch(`${baseUrl}/api/rooms/fetchRoomMessages/${roomId}`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(ah || {}),
      },
    });

    if (!res.ok) {
      // fallback simples
      console.log("🚨 erro ao buscar mensagens")
      setMessages([]);
      return;
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : (data?.messages || []);
    console.log("mensagens da sala:", list)
    setMessages(list);
    setAreMessagesReady(true)
  } catch (err) {
    console.error("🚨 Erro ao buscar mensagens:", err);
    setMessages([]);
  }
}

// ================================================================
// 3 send messages util
// ================================================================
export async function sendMessage({
  socket,
  roomId,
  currentUser,
  newMessage,
  setNewMessage,
}) {
  const text = (newMessage || "").trim();
  if (!socket?.connected || !roomId || !currentUser?._id || !text) return;

  // Use o evento correto do seu backend:
  // - chat de sala: "sendMessage"
  // - DM: "sendPrivateMessage" (ou "newPrivateMessage" se você padronizou assim)
  socket.emit(
    "sendMessage",
    { roomId, text, senderId: currentUser._id },
    (ack) => {
      if (ack?.ok === false) {
        console.warn("Falha ao enviar mensagem:", ack?.error);
        // aqui você pode exibir um toast/erro
      }
    }
  );

  setNewMessage("");
}


// ================================================================
// 4 Delete message util (com otimista + rollback)
// ================================================================
export async function deleteMessageAction({
  socket,
  roomId,
  messageId,
  setMessages,
  eventName = "deleteMessage", // 🔁 ajuste se seu backend usar outro evento
}) {
  console.log("deleting message...")
  if (!socket || !roomId || !messageId || typeof setMessages !== "function") {
    console.warn("deleteMessageAction: parâmetros inválidos", {
      hasSocket: !!socket,
      roomId,
      messageId,
      hasSetter: typeof setMessages === "function",
    });
    return;
  }

  // backup do estado atual (clone para rollback)
  let backup;
  setMessages((prev) => {
    backup = prev.slice();
    return prev.filter((m) => String(m._id) !== String(messageId));
  });

  try {
    await new Promise((resolve, reject) => {
      console.log("emmiting:", eventName)
      socket.emit(eventName, { messageId, roomId }, (ack) => {
        // Se o servidor não enviar { ok: false }, consideramos sucesso
        if (!ack || ack.ok !== false) return resolve(ack);
        reject(ack);
      });
    });
  } catch (err) {
    console.warn("Falha ao deletar no servidor, revertendo…", err);
    // rollback
    setMessages(backup);
  }
}

// ================================================================
// 5 start live
// ================================================================

// 5.a
// src/context/functions.js/roomContextFunctions.js
export const startLiveCore = async (args = {}) => {
  try {
    console.log("Function to start live...");
    const { baseUrl, currentUser, roomId, joinChannel } = args;

    const userId = currentUser?._id ?? null;
    console.log("startLiveCore args:", {
      baseUrl,
      userId,
      roomId,
      hasJoin: typeof joinChannel === "function",
    });

    if (!baseUrl) return { ok: false, reason: "missing_baseUrl" };
    if (!userId) return { ok: false, reason: "missing_userId" };
    if (!roomId) return { ok: false, reason: "missing_roomId" };

    const res = await fetch(`${baseUrl}/api/rooms/${roomId}/live/start`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      return { ok: false, status: res.status, message: msg || "falha ao iniciar" };
    }

    let data = null;
    try { data = await res.json(); } catch {}

    // entra no canal de áudio (se a função existir)
    if (typeof joinChannel === "function") {
      await joinChannel(roomId, userId);
    }

    return { ok: true, data };
  } catch (err) {
    console.error("startLiveCore error:", err);
    return { ok: false, reason: "exception", message: String(err?.message || err) };
  }
};




// 5.b
// export async function startLiveAction({
//   baseUrl,
//   currentUser,
//   roomId,
//   joinChannel,
//   setIsSpeaker,
//   setIsLive,
//   setIsRoomLive,
//   refreshRoom,
// }) {
//   if (!currentUser?._id || !roomId) return { ok: false, reason: "missing_params" };

//   const result = await startLiveCore({ baseUrl, currentUser, roomId, joinChannel });
//   if (!result.ok) return result;

//   setIsSpeaker?.(true);
//   setIsLive?.(true);
//   setIsRoomLive?.(true);
//   await refreshRoom?.(roomId);
//   return result;
// }



// ================================================================
// 2 add current user to currentUsersInRoom
// ================================================================

export const joinRoomListeners = ({ socket, roomId, currentUserId, setCurrentRoomId, setCurrentUsers, setCurrentUsersSpeaking, setRoomReady }) => {
  console.log("adicinando usuario na sala...")
  if (!roomId || !currentUserId) return;
  setCurrentRoomId(roomId);
  setCurrentUsers([]);
  setCurrentUsersSpeaking([]);
  setRoomReady(false);

  const emitJoin = () => socket?.emit?.("joinLiveRoom", { roomId });
  if (socket?.connected) emitJoin();
  else socket?.once?.("connect", emitJoin);
};

// ================================================================
// 3 Fetch chat
// ================================================================

// export const fetchMessages = async ({ currentUser, roomId, baseUrl }) => {
//   console.log("fetching messages")
//   if (!currentUser || !roomId || !baseUrl) return [];
//   try {
//     const response = await fetch(`${baseUrl}/api/rooms/fetchRoomMessages/${roomId}`, { method: "GET" });
//     if (!response.ok) return [];
//     const data = await response.json();
//     return Array.isArray(data) ? data : data?.messages || [];
//   } catch (err) {
//     console.log("🚨 Erro ao buscar mensagens:", err);
//     return [];
//   }
// };

export function wireChat({
  socket,
  currentRoomId,
  currentUser,
  setMessages,
}) {
  if (!socket || !currentRoomId || !currentUser?._id) return () => {};
  console.log("wireChat")

  const doJoin = () => {
    socket.emit(EV.CHAT_JOIN, { roomId: currentRoomId, user: currentUser }, () => {
      socket.emit(EV.CHAT_HISTORY_REQ, { roomId: currentRoomId });
    });
  };

  doJoin();
  socket.on("connect", doJoin);

  const onHistory = (payload) => {
    const list = Array.isArray(payload) ? payload : payload?.messages;
    setMessages(Array.isArray(list) ? list : []);
  };

  const onMsg = (msg) => {
    if (String(msg?.roomId) !== String(currentRoomId)) return;
    setMessages((prev) => [...prev, msg]);
  };

  const onDel = ({ messageId, roomId }) => {
    if (String(roomId) !== String(currentRoomId)) return;
    setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
  };

  socket.on(EV.CHAT_HISTORY, onHistory);
  socket.on(EV.CHAT_MSG, onMsg);
  socket.on(EV.CHAT_DELETE, onDel);

  return () => {
    socket.emit(EV.CHAT_LEAVE, { roomId: currentRoomId });
    socket.off("connect", doJoin);
    socket.off(EV.CHAT_HISTORY, onHistory);
    socket.off(EV.CHAT_MSG, onMsg);
    socket.off(EV.CHAT_DELETE, onDel);
  };
}

// ---------- Utils de socket ----------
export const sendMessageUtil = ({ socket, event = EV.CHAT_SEND, payload }) =>
  new Promise((resolve, reject) => {
    if (!socket?.emit) return reject(new Error("Socket indisponível"));
    socket.emit(event, payload, (ack) => {
      if (!ack) return resolve(null);     // seu back pode não usar ACK
      if (ack?.ok === false) return reject(ack);
      resolve(ack);                        // ideal: volta a msg persistida
    });
  });

// ---------- Helpers puros ----------
export const extractSpeakers = (roomObj) =>
  Array.isArray(roomObj?.speakers) ? roomObj.speakers : [];

export const isUserSpeaker = (currentUsersSpeaking, userId) => {
  if (!userId || !Array.isArray(currentUsersSpeaking)) return false;
  return currentUsersSpeaking.some(
    (s) => String(s?._id || s?.userId || s?.user?._id) === String(userId)
  );
};

// ---------- Ações (recebem deps e setStates do Context) ----------
export async function refreshRoomAction({
  rid,
  currentRoomId,
  baseUrl,
  currentUser,
  setIsCreator,
  setRoom,
  setCurrentUsersSpeaking,
  setRoomReady,
  setMessages,
}) {
  const roomId = rid ?? currentRoomId;
  if (!roomId || !baseUrl) return null;

  const [roomData, msgsRaw] = await Promise.all([
    fetchRoomData({ roomId, baseUrl, currentUser, setIsCreator }),
    // fetchMessages({ currentUser, roomId, baseUrl }),
  ]);

    // ⚠️ Calcule isCreator de forma robusta e CHAME o setter corretamente
  const userId = currentUser?._id;
  const ownerId = roomData?.owner?._id ?? roomData?.createdBy?._id;
  const amCreator = !!userId && !!ownerId && String(ownerId) === String(userId);
  setIsCreator?.(amCreator);

  if (roomData) {
    setRoom?.(roomData);
    setCurrentUsersSpeaking?.(extractSpeakers(roomData));
    setRoomReady?.(true);
  }
  const normalized = Array.isArray(msgsRaw) ? msgsRaw : (msgsRaw?.messages || []);
  setMessages?.(normalized);

  return { room: roomData, messages: normalized };
}





export function wireLiveUsers({
  socket,
  currentRoomId,
  setCurrentUsers,
  setCurrentUsersSpeaking,
  setRoomReady,
  refreshRoom,
}) {
  if (!socket) return () => {};

  const onLiveUsers = (payload) => {
    if (!payload) return;
    const { roomId: rid, users = [], speakers } = Array.isArray(payload)
      ? { roomId: currentRoomId, users: payload }
      : payload;

    if (currentRoomId && rid && String(rid) !== String(currentRoomId)) return;

    setCurrentUsers(Array.isArray(users) ? users : []);
    const computedSpeakers = Array.isArray(speakers) ? speakers : users.filter((u) => u.isSpeaker);
    setCurrentUsersSpeaking(computedSpeakers);
    setRoomReady(true);
  };

  const onRoomLive = ({ roomId: rid }) => {
    if (String(rid) === String(currentRoomId)) refreshRoom?.(rid);
  };

  socket.on("liveRoomUsers", onLiveUsers);
  socket.on("room:live", onRoomLive);

  // refresh leve quando chega liveRoomUsers
  const onUsersAndMaybeRefresh = async (payload) => {
    onLiveUsers(payload);
    if (currentRoomId) refreshRoom?.(currentRoomId);
  };
  socket.off("liveRoomUsers", onLiveUsers);
  socket.on("liveRoomUsers", onUsersAndMaybeRefresh);

  return () => {
    socket.off("liveRoomUsers", onLiveUsers);
    socket.off("liveRoomUsers", onUsersAndMaybeRefresh);
    socket.off("room:live", onRoomLive);
  };
}



export const emitJoinAsSpeaker = ({ socket, roomId, user }) => {
  if (!roomId || !user || !socket) return;
  socket.emit("joinAsSpeaker", { roomId });
};

export const emitLeaveRoom = ({ 
  socket, 
  roomId, 
  resetFns
 }) => {
  if (!roomId || !socket) return;
  socket.emit("leaveLiveRoom", { roomId });
  resetFns?.(); // opcional para limpar estados
};

export const handleJoinRoomAction = async ({
  roomId,
  user,
  baseUrl,
  socket,
  setCurrentRoomId,
  setCurrentUsers,
  setCurrentUsersSpeaking,
  setRoomReady,
  currentUser,
}) => {
  if (!roomId || !user) return null;

  joinRoomListeners({
    socket,
    roomId,
    user,
    setCurrentRoomId,
    setCurrentUsers,
    setCurrentUsersSpeaking,
    setRoomReady,
  });

  try {
    const res = await fetch(`${baseUrl}/api/rooms/addCurrentUser`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, user }),
    });

    let data = null;
    if (res.status !== 204) {
      try { data = await res.json(); } catch {}
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${data?.message || res.statusText}`);

    setCurrentUsers(data.currentUsersInRoom || []);
    return data;
  } catch (err) {
    console.error("erro addCurrentUser:", err);
    return null;
  }
};

export const handleLeaveRoomAction = async ({
  roomId,
  user,
  baseUrl,
  leaveChannel,
  navigate,
  ownerId,
  isSpeaker,
  socket,
  onResetUI, // função que limpa estados (RoomContext controla)
}) => {
  if (!roomId) return;

  try {
    if (ownerId && user?._id && String(ownerId) === String(user._id)) {
      await fetch(`${baseUrl}/api/rooms/${roomId}/live/stop`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
    } else if (isSpeaker) {
      await fetch(`${baseUrl}/api/rooms/${roomId}/speakers/leave`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
    }
  } catch (e) {
    console.error("Erro ao encerrar/descer do palco:", e);
  }

  emitLeaveRoom({ socket, roomId, resetFns: onResetUI });

  try {
    await leaveChannel?.();
  } finally {
    navigate?.("/");
  }
};

export async function sendMessageAction({
  socket,
  currentRoomId,
  currentUser,
  newMessage,
  setMessages,
  setNewMessage,
}) {
  const text = newMessage?.trim();
  if (!text || !socket || !currentRoomId || !currentUser?._id) return;

  const tempId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const msg = {
    _id: tempId,
    roomId: currentRoomId,
    userId: currentUser._id,
    username: currentUser.username || currentUser.firstName || "Usuário",
    profileImage: currentUser.profileImage || "",
    message: text,
    timestamp: Date.now(),
  };

  setMessages((prev) => [...prev, msg]);
  setNewMessage("");

  try {
    const saved = await sendMessageUtil({ socket, event: EV.CHAT_SEND, payload: msg });
    if (saved?._id) {
      setMessages((prev) => prev.map((m) => (m._id === tempId ? saved : m)));
    }
  } catch (err) {
    setMessages((prev) => prev.filter((m) => m._id !== tempId));
    console.warn("Falha ao enviar mensagem:", err);
  }
}


