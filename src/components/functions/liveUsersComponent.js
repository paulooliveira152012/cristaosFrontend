// src/components/functions/liveUsersComponent.js
const baseUrl = process.env.REACT_APP_API_BASE_URL;

// Busca todos os usuários e joga no state
export const getAllUsers = async (setAllUsers) => {
  const res = await fetch(`${baseUrl}/api/users/getAllUsers`, {
    method: "GET",
    credentials: "include", // se sua rota exige cookie/JWT
  });
  const data = await res.json().catch(() => ({}));
  setAllUsers(Array.isArray(data?.users) ? data.users : []);
};

// Busca os amigos do usuário e devolve um Set de IDs (string)
export async function getFriendIds(currentUserId) {
  if (!currentUserId) return new Set();
  const res = await fetch(`${baseUrl}/api/users/${currentUserId}/friends`, {
    method: "GET",
    credentials: "include", // importante p/ cookie/jwt
  });
  if (!res.ok) return new Set();

  const data = await res.json().catch(() => ({}));
  // O back pode retornar { friends: [...] } com objetos (populate) ou só ids.
  const list = Array.isArray(data?.friends) ? data.friends : [];

  // Normaliza: pega _id se existir, senão o próprio valor
  const ids = list
    .map((f) => String(f?._id ?? f?.id ?? f))  // cobre populate e array de strings
    .filter(Boolean);

  return new Set(ids);
}

export async function sendFriendRequest(targetUserId) {
  const url = `${baseUrl}/api/users/friendRequest/${encodeURIComponent(targetUserId)}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // precisa do cookie/JWT do protect
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // no back você usa "error"; às vezes usamos "message" —
    // trate ambos para mostrar algo útil
    throw new Error(data.error || data.message || "Falha ao enviar pedido de amizade.");
  }
  return data; // { message: "Pedido de amizade enviado com sucesso." }
}