const baseUrl = process.env.REACT_APP_API_BASE_URL;

// 🔹 Buscar lista de amigos
export const fetchUserFriends = async (userId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/${userId}/friends`, {
      method: "GET",
      credentials: "include", // Se estiver usando cookies para auth
    });

    if (!response.ok) throw new Error("Erro ao buscar amigos.");

    const data = await response.json();
    return data.friends; // [{ username, _id, profileImage }]
  } catch (error) {
    console.error("Erro em fetchUserFriends:", error);
    return [];
  }
};

// 🔹 Enviar pedido de amizade
export const sendFriendRequest = async (friendId) => {
    console.log("chamando backend para solicitar amizade")
    console.log(baseUrl)
  try {
    const response = await fetch(`${baseUrl}/api/users/friendRequest/${friendId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao enviar pedido.");
    return data;
  } catch (error) {
    console.error("Erro em sendFriendRequest:", error);
    return { error: error.message };
  }
};

// 🔹 Aceitar pedido de amizade
export const acceptFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/acceptFriend/${requesterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao aceitar pedido.");
    return data;
  } catch (error) {
    console.error("Erro em acceptFriendRequest:", error);
    return { error: error.message };
  }
};

// 🔹 Recusar pedido de amizade
export const rejectFriendRequest = async (requesterId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/rejectFriend/${requesterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao recusar pedido.");
    return data;
  } catch (error) {
    console.error("Erro em rejectFriendRequest:", error);
    return { error: error.message };
  }
};

// 🔹 Remover amigo
export const removeFriend = async (friendId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/removeFriend/${friendId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao remover amigo.");
    return data;
  } catch (error) {
    console.error("Erro em removeFriend:", error);
    return { error: error.message };
  }
};

// 🔹 Buscar pedidos pendentes recebidos
export const fetchFriendRequests = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/users/friendRequests`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao buscar pedidos.");

    return data.friendRequests; // [{ _id, username, profileImage }]
  } catch (error) {
    console.error("Erro em fetchFriendRequests:", error);
    return [];
  }
};
