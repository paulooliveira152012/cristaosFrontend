// src/pages/functions/liveRoomFunctions2.js
export const fetchRoomData = async ({ roomId, baseUrl }) => {
  if (!roomId || !baseUrl) return null;

  const res = await fetch(`${baseUrl}/api/rooms/fetchRoomData/${roomId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    let msg = "Erro ao buscar sala";
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new Error(msg);
  }

  return res.json(); // deve retornar { roomTitle, createdBy, owner, speakers, ... }
};

// ============= start a new live

// startLive "core" puro
export const startLiveCore = async ({
  baseUrl,
  currentUser,
  roomId,
  joinChannel,           // função
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
    return { ok: false, status: res.status, message: msg || "falha ao iniciar" };
  }

  let data = null;
  try { data = await res.json(); } catch {}

  // entra no canal (mutado por padrão)
  await joinChannel(roomId, currentUser._id);

  return { ok: true, data };
};