const baseUrl = process.env.REACT_APP_API_BASE_URL;

// Buscar pedidos de amizade recebidos
export const fetchFriendRequests = async (userId) => {
  console.log("useEffect for fetching friend requests");
  try {
    const response = await fetch(`${baseUrl}/api/users/${userId}/friendRequests`, {
      credentials: "include"
    });
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
    const response = await fetch(`${baseUrl}/api/users/acceptFriend/${requesterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao aceitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao aceitar pedido:", error);
  }
};

// Rejeitar pedido de amizade
export const rejectFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/rejectFriend/${requesterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao rejeitar pedido de amizade");
    return await response.json();
  } catch (error) {
    console.error("Erro ao rejeitar pedido:", error);
  }
};

// Buscar todas as notificações do usuário
export const fetchNotifications = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar notificações");
    const data = await response.json();
    return data; // já é o array direto
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
};


// Marcar uma notificação como lida
export const markNotificationAsRead = async (notifId) => {
  try {
    const response = await fetch(`${baseUrl}/api/notifications/read/${notifId}`, {
      method: "PATCH",
    });
    if (!response.ok) throw new Error("Erro ao marcar notificação como lida");
    return await response.json();
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
  }
};
