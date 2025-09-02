// components/Admin/functions/leaderFunctions.js
import { authHeaders } from "../utils/AuthHeaders";
const apiUrl = process.env.REACT_APP_API_BASE_URL || "";

const isLeaderUser = (u) => u?.role === "leader" || u?.leader === true;

export const getAllMembers = async ({ setMembers, setBannedMembers, isLeader }) => {
  if (!isLeader) {
    console.log("Somente um líder pode buscar todos os membros para gerenciar");
    return { users: [], active: [], banned: [], leaders: [] };
  }

  const res = await fetch(`${apiUrl}/api/adm/getAllUsers`, {
    method: "GET",
    headers: authHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }

  const payload = await res.json();
  // Suporta formatos: array direto OU { users, currentUserFriends }
  const users = Array.isArray(payload) ? payload : (payload.users || []);

  const active  = users.filter((u) => u?.isBanned !== true);
  const banned  = users.filter((u) => u?.isBanned === true);
  const leaders = active.filter(isLeaderUser);

  setMembers?.(active);
  setBannedMembers?.(banned);

  return { users, active, banned, leaders };
};

export const banMember = async ({ isLeader, userId }) => {
  if (!isLeader) throw new Error("Apenas líderes podem banir.");
  if (!userId) throw new Error("userId ausente.");

  const res = await fetch(`${apiUrl}/api/adm/ban`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ userId, ban: true }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Falha ao banir (HTTP ${res.status})`);
  }
  return res.json(); // opcional: { ok: true, user }
};

export const unbanMember = async ({ isLeader, userId }) => {
  if (!isLeader) throw new Error("Apenas líderes podem desbanir.");
  if (!userId) throw new Error("userId ausente.");

  // Se seu backend tiver /adm/unban use essa rota.
  // Caso não tenha, reaproveite /adm/ban com { ban: false }.
  const res = await fetch(`${apiUrl}/api/adm/unban`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    // fallback para /ban com ban:false
    const alt = await fetch(`${apiUrl}/api/adm/ban`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ userId, ban: false }),
    });
    if (!alt.ok) {
      const text = await alt.text().catch(() => "");
      throw new Error(text || `Falha ao desbanir (HTTP ${alt.status})`);
    }
    return alt.json();
  }
  return res.json();
};

// leaderFunctions.js
export const strike = async ({ listingId, userId }) => {
  console.log("giving a strike on user");
  console.log("listingId:", listingId);
  console.log("userId:", userId);
  // TODO: chamada ao backend (exemplo):
  const res = await fetch(`${apiUrl}/api/adm/strike`, { 
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify ({
      listingId,
      userId
    })
   });
  return res.json();
}