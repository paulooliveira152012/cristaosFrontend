const baseUrl = process.env.REACT_APP_API_BASE_URL;

// Buscar pedidos de amizade recebidos
export const fetchFriendRequests = async (userId) => {
  console.log("useEffect for fetching friend requests");
  try {
    const response = await fetch(
      `${baseUrl}/api/users/${userId}/friendRequests`,
      {
        credentials: "include",
      }
    );
    if (!response.ok) throw new Error("Erro ao buscar pedidos de amizade");
    const data = await response.json();
    return data; // Agora retorna direto o array
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    if (!response.ok) throw new Error("Erro ao aceitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
  }
};

// Rejeitar pedido de amizade
export const rejectFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/users/rejectFriend/${requesterId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    if (!response.ok) throw new Error("Erro ao rejeitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar pedido:", error);
  }
};

// Aceitar pedido de amizade
// notificationsFunctions.js
export const acceptDmRequest = async (payload) => {
  console.log("Aceitando dm...")
  const res = await fetch(`${baseUrl}/api/dm/accept`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao aceitar solicitação de conversa");
  return res.json(); // { message, conversation }
};


export const rejectDmRequest = async (
  requester,
  requested,
  conversationId,
  notificationId
) => {
  const requesterId = typeof requester === "object" ? requester._id : requester;
  const requestedId = typeof requested === "object" ? requested._id : requested;

  console.log("conversationId:", conversationId)

  try {
    const response = await fetch(`${baseUrl}/api/dm/rejectChatRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        requester: requesterId,
        requested: requestedId,
        conversationId, // ✅ novo
        notificationId, //
      }),
    });

    if (!response.ok)
      throw new Error("Erro ao rejeitar solicitação de conversa");

    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar DM:", error);
  }
};

// Buscar todas as notificações
export const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "GET",
      credentials: "include", // cookies (se usados)
      headers, // bearer (se existir)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("GET /api/notifications falhou:", res.status, text);
      throw new Error(`Falha ${res.status}`);
    }

    return await res.json(); // array
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return [];
  }
};

// Marcar uma notificação como lida
// Marcar UMA como lida (sem token; usa cookie)
export const markNotificationAsRead = async (notifId) => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read/${notifId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Erro ao marcar notificação como lida");
    return await res.json();
  } catch (err) {
    console.error("Erro ao marcar notificação como lida:", err);
  }
};
