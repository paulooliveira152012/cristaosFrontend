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
export const fetchRoomData = async ({ roomId, baseUrl, currentUser, setIsCreator }) => {
  if (!roomId || !baseUrl) return null;

  const res = await fetch(`${baseUrl}/api/rooms/fetchRoomData/${roomId}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let msg = "Erro ao buscar sala";
    try {
      msg = (await res.json())?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const roomCreator = data?.createdBy?._id;
  if (currentUser?._id && roomCreator && String(currentUser._id) === String(roomCreator)) {
    setIsCreator?.(true);
  }
  return data;
};

export const startLiveCore = async ({ baseUrl, currentUser, roomId, joinChannel }) => {
  if (!baseUrl || !currentUser?._id || !roomId) return { ok: false, reason: "missing_params" };

  const res = await fetch(`${baseUrl}/api/rooms/${roomId}/live/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser._id }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    return { ok: false, status: res.status, message: msg || "falha ao iniciar" };
  }

  let data = null;
  try { data = await res.json(); } catch {}

  await joinChannel?.(roomId, currentUser._id);
  return { ok: true, data };
};

export const fetchMessages = async ({ currentUser, roomId, baseUrl }) => {
  if (!currentUser || !roomId || !baseUrl) return [];
  try {
    const response = await fetch(`${baseUrl}/api/rooms/fetchRoomMessages/${roomId}`, { method: "GET" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data?.messages || [];
  } catch (err) {
    console.log("🚨 Erro ao buscar mensagens:", err);
    return [];
  }
};

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
    fetchMessages({ currentUser, roomId, baseUrl }),
  ]);

  if (roomData) {
    setRoom?.(roomData);
    setCurrentUsersSpeaking?.(extractSpeakers(roomData));
    setRoomReady?.(true);
  }
  const normalized = Array.isArray(msgsRaw) ? msgsRaw : (msgsRaw?.messages || []);
  setMessages?.(normalized);

  return { room: roomData, messages: normalized };
}

export async function startLiveAction({
  baseUrl,
  currentUser,
  roomId,
  joinChannel,
  setIsSpeaker,
  setIsLive,
  setIsRoomLive,
  refreshRoom,
}) {
  if (!currentUser?._id || !roomId) return { ok: false, reason: "missing_params" };

  const result = await startLiveCore({ baseUrl, currentUser, roomId, joinChannel });
  if (!result.ok) return result;

  setIsSpeaker?.(true);
  setIsLive?.(true);
  setIsRoomLive?.(true);
  await refreshRoom?.(roomId);
  return result;
}

export function wireChat({
  socket,
  currentRoomId,
  currentUser,
  setMessages,
}) {
  if (!socket || !currentRoomId || !currentUser?._id) return () => {};

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

export const joinRoomListeners = ({ socket, roomId, user, setCurrentRoomId, setCurrentUsers, setCurrentUsersSpeaking, setRoomReady }) => {
  if (!roomId || !user) return;
  setCurrentRoomId(roomId);
  setCurrentUsers([]);
  setCurrentUsersSpeaking([]);
  setRoomReady(false);

  const emitJoin = () => socket?.emit?.("joinLiveRoom", { roomId });
  if (socket?.connected) emitJoin();
  else socket?.once?.("connect", emitJoin);
};

export const emitJoinAsSpeaker = ({ socket, roomId, user }) => {
  if (!roomId || !user || !socket) return;
  socket.emit("joinAsSpeaker", { roomId });
};

export const emitLeaveRoom = ({ socket, roomId, resetFns }) => {
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

export async function deleteMessageAction({ socket, roomId, messageId, messages, setMessages }) {
  if (!socket || !roomId) return;
  const backup = messages;
  setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));

  try {
    await new Promise((resolve, reject) => {
      socket.emit(EV.CHAT_DELETE_REQ, { messageId, roomId }, (ack) => {
        if (!ack || ack.ok !== false) return resolve(ack);
        reject(ack);
      });
    });
  } catch (err) {
    console.warn("Falha ao deletar, revertendo:", err);
    setMessages(backup);
  }
}
