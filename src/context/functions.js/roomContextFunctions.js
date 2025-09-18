// src/pages/functions/liveRoomFunctions2.js
export const fetchRoomData = async ({
  roomId,
  baseUrl,
  currentUser,
  setIsCreator,
}) => {
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

  // console.log("res para verificar dono da sala:", data);
  // console.log("currentUser:", currentUser);

  const roomCreator = data.createdBy._id;

  const isCreator = currentUser._id == roomCreator;
  // console.log("isCreator na busca da sala?", isCreator);

  if (isCreator) {
    setIsCreator(true);
  }

  return data; // deve retornar { roomTitle, createdBy, owner, speakers, ... }
};

// ============= start a new live

// startLive "core" puro
export const startLiveCore = async ({
  baseUrl,
  currentUser,
  roomId,
  joinChannel, // função
}) => {
  if (!baseUrl || !currentUser?._id || !roomId) {
    return { ok: false, reason: "missing_params" };
  }

  const res = await fetch(`${baseUrl}/api/rooms/${roomId}/live/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser._id }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      message: msg || "falha ao iniciar",
    };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {}

  // entra no canal (mutado por padrão)
  await joinChannel(roomId, currentUser._id);

  return { ok: true, data };
};

export const fetchMessages = async ({ currentUser, roomId, baseUrl }) => {
  console.log("fetching messages");

  if (!currentUser || !roomId || !baseUrl) {
    console.log("🚨 missing currentUser or roomId");
    return [];
  }

  console.log("currentUser:", currentUser);
  console.log("roomId:", roomId);
  console.log("baseUrl:", baseUrl);

  try {
    const response = await fetch(
      `${baseUrl}/api/rooms/fetchRoomMessages/${roomId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      console.log(
        "erro ao buscar mensagens",
        response.status,
        response.statusText
      );
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data?.messages || [];
  } catch (err) {
    console.log("🚨 Erro ao buscar mensagens:", err);
  }
};

// roomContextFunctions.js
export const sendMessageUtil = ({ socket, event = "chat:message", payload }) =>
  new Promise((resolve, reject) => {
    if (!socket?.emit) return reject(new Error("Socket indisponível"));
    socket.emit(event, payload, (ack) => {
      // se seu back não usa ack, resolve sem nada
      if (!ack) return resolve(null);
      // se seu back retorna erro padronizado
      if (ack?.ok === false) return reject(ack);
      return resolve(ack); // ideal: o back devolve a msg persistida
    });
  });
