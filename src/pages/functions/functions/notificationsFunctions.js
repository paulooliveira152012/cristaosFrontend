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
export const acceptDmRequest = async (requester, requested, notificationId) => {
  const requesterId = typeof requester === "object" ? requester._id : requester;
  const requestedId = typeof requested === "object" ? requested._id : requested;

  console.log(requestedId, "accepting dm... from", requesterId);

  try {
    const response = await fetch(`${baseUrl}/api/dm/startNewConversation/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        requester: requesterId,
        requested: requestedId,
        notificationId, // ID da notificação
      }),
    });
    if (!response.ok) throw new Error("Erro ao aceitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
  }
};

export const rejectDmRequest = async (requester, requested) => {
  const requesterId = typeof requester === "object" ? requester._id : requester;
  const requestedId = typeof requested === "object" ? requested._id : requested;

  try {
    const response = await fetch(`${baseUrl}/api/dm/rejectChatRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        requester: requesterId,
        requested: requestedId,
      }),
    });

    if (!response.ok) throw new Error("Erro ao rejeitar solicitação de conversa");

    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar DM:", error);
  }
};





// Buscar todas as notificações
export const fetchNotifications = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar notificações");
    return await response.json();
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