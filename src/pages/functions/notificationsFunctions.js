// notificationsFunctions.js
const baseUrl = process.env.REACT_APP_API_BASE_URL;

/** Headers com Bearer + JSON, reaproveitando o mesmo authToken do SocketContext */
const authHeaders = () => {
  const token = localStorage.getItem("authToken"); // ✅ mesma chave do SocketContext
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

/* ===========================
 * Pedidos de amizade
 * =========================== */

// Buscar pedidos de amizade recebidos
export const fetchFriendRequests = async (userId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/users/${userId}/friendRequests`,
      {
        method: "GET",
        credentials: "include",
        headers: authHeaders(),
      }
    );
    if (!response.ok) throw new Error("Erro ao buscar pedidos de amizade");
    return await response.json(); // array
  } catch (error) {
    console.error("Erro ao buscar pedidos de amizade:", error);
    return [];
  }
};

// Aceitar pedido de amizade
export const acceptFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/users/acceptFriend/${requesterId}`,
      {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        // body: JSON.stringify({}) // se seu back exigir body
      }
    );
    if (!response.ok) throw new Error("Erro ao aceitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
    return null;
  }
};

// Rejeitar pedido de amizade
export const rejectFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/users/rejectFriend/${requesterId}`,
      {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        // body: JSON.stringify({}) // se seu back exigir body
      }
    );
    if (!response.ok) throw new Error("Erro ao rejeitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar pedido:", error);
    return null;
  }
};

/* ===========================
 * Solicitações de DM
 * =========================== */

// Aceitar pedido de DM
export const acceptDmRequest = async (payload) => {
  try {
    const res = await fetch(`${baseUrl}/api/dm/accept`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erro ao aceitar solicitação de conversa");
    return await res.json(); // { message, conversation }
  } catch (err) {
    console.error("Erro ao aceitar DM:", err);
    throw err;
  }
};

// Rejeitar pedido de DM
export const rejectDmRequest = async (
  requester,
  requested,
  conversationId,
  notificationId
) => {
  const requesterId = typeof requester === "object" ? requester._id : requester;
  const requestedId = typeof requested === "object" ? requested._id : requested;

  try {
    const response = await fetch(`${baseUrl}/api/dm/rejectChatRequest`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({
        requester: requesterId,
        requested: requestedId,
        conversationId,
        notificationId,
      }),
    });

    if (!response.ok)
      throw new Error("Erro ao rejeitar solicitação de conversa");

    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar DM:", error);
    return null;
  }
};

/* ===========================
 * Notificações
 * =========================== */

// Buscar todas as notificações
export const fetchNotifications = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "GET",
      credentials: "include",      // ok ter cookie, mas não depender apenas dele
      headers: authHeaders(),       // ✅ manda Bearer se houver
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("GET /api/notifications falhou:", res.status, text);
      return null; // não quebra a tela
    }

    return await res.json(); // array
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return null;
  }
};

// Marcar uma notificação como lida
export const markNotificationAsRead = async (notifId) => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read/${notifId}`, {
      method: "PUT",
      credentials: "include",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Erro ao marcar notificação como lida");
    return await res.json();
  } catch (err) {
    console.error("Erro ao marcar notificação como lida:", err);
    return null;
  }
};

export const toggleNotificationsByEmail = async ({ userId, enabled }) => {
  console.log("toggling notification by email...", { userId, enabled });

  const res = await fetch(
    `${baseUrl}/api/notifications/${userId}/notifications/email`,
    
    {
      method: "PUT",
      headers:  authHeaders(),
      credentials: "include", // se usar cookie/sessão
      body: JSON.stringify({ enabled }), // manda o PRÓXIMO valor
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao alternar notificação por e-mail: ${res.status} - ${text}`);
  }

  return res.json(); // { notificationsByEmail: boolean }
};
