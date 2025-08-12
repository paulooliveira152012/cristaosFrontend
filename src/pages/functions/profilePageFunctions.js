const baseUrl = process.env.REACT_APP_API_BASE_URL;

// 🔹 Buscar dados do perfil e listagens
export const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`${baseUrl}/api/listings/users/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return { user: data.user, listings: data.listings };
    } else {
      throw new Error("Response is not valid JSON");
    }
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
    throw error;
  }
};

// 🔹 Buscar comentários da listagem
export const fetchListingComments = async (listingId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/comments/listings/${listingId}/comments`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch comments");

    const data = await response.json();
    return data.comments;
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    throw error;
  }
};

// 🔹 Deletar listagem
export const deleteListing = async (listingId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/listings/delete/${listingId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to delete listing.");

    return await response.json();
  } catch (error) {
    console.error("Erro ao deletar listing:", error);
    throw error;
  }
};

// 🔹 Enviar comentário
export const submitComment = async (listingId, userId, commentText) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/comments/listings/${listingId}/comment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, commentText }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to submit comment");
    }

    const data = await response.json();
    return data.comment;
  } catch (error) {
    console.error("Erro ao enviar comentário:", error);
    throw error;
  }
};

// 🔹 Curtir/Descurtir listagem
export const toggleListingLike = async (listingId, userId) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/listings/listingLike/${listingId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update like status");
    }

    const data = await response.json();
    return data.likes;
  } catch (error) {
    console.error("Erro ao curtir/descurtir:", error);
    throw error;
  }
};

// 🔹 Deletar comentário (pai ou resposta)
export const deleteComment = async (commentId, parentCommentId = null) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  const endpoint = parentCommentId
    ? `${baseUrl}/api/comments/${commentId}/${parentCommentId}`
    : `${baseUrl}/api/comments/${commentId}`;

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar comentário.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao deletar comentário:", error);
    throw error;
  }
};

// 🔹 Enviar resposta para comentário
export const submitReply = async (parentCommentId, userId, replyText) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  try {
    const response = await fetch(
      `${baseUrl}/api/comments/listings/${parentCommentId}/reply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, replyText }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erro ao enviar resposta.");
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
    throw error;
  }
};

// 🔹 Curtir ou descurtir comentário ou resposta
export const toggleCommentLike = async ({
  commentId,
  userId,
  isReply = false,
  parentCommentId = null,
}) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  const apiUrl = isReply
    ? `${baseUrl}/api/comments/comment/like/${parentCommentId}/${commentId}`
    : `${baseUrl}/api/comments/comment/like/${commentId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Erro ao curtir/descurtir comentário."
      );
    }

    const data = await response.json();
    return data.likes;
  } catch (error) {
    console.error("Erro ao curtir/descurtir comentário:", error);
    throw error;
  }
};

// 🔹 Compartilhar uma listagem
export const shareListing = async (listingId, userId) => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/api/listings/share/${listingId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erro ao compartilhar listagem.");
    }

    return data;
  } catch (error) {
    console.error("Erro ao compartilhar a listagem:", error);
    throw error;
  }
};

// 🔹 Buscar amigos do usuário
export const fetchUserFriends = async (userId) => {
  try {
    const response = await fetch(`${baseUrl}/api/users/${userId}/friends`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Erro ao buscar amigos.");

    const data = await response.json();
    return data.friends;
  } catch (error) {
    console.error("Erro em fetchUserFriends:", error);
    return [];
  }
};

// 🔹 Enviar pedido de amizade
export const sendFriendRequest = async (friendId) => {
  console.log("sending friend request...");

  try {
    const response = await fetch(
      `${baseUrl}/api/users/friendRequest/${friendId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

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
    const response = await fetch(
      `${baseUrl}/api/users/acceptFriend/${requesterId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

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
    const response = await fetch(
      `${baseUrl}/api/users/rejectFriend/${requesterId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

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
    const response = await fetch(
      `${baseUrl}/api/users/removeFriend/${friendId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao remover amigo.");
    return data;
  } catch (error) {
    console.error("Erro em removeFriend:", error);
    return { error: error.message };
  }
};

// 🔹 Buscar pedidos pendentes
export const fetchFriendRequests = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/users/friendRequests`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao buscar pedidos.");
    return data.friendRequests;
  } catch (error) {
    console.error("Erro em fetchFriendRequests:", error);
    return [];
  }
};

// requesting chat
export const requestChat = async (requester, requested) => {
  console.log(requester, "requesting chat with", requested);

  try {
    const response = await fetch(`${baseUrl}/api/dm/sendChatRequest`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester, requested }),
    });

    console.log("response:", response);
  } catch (error) {
    console.log(error);
  }
};

// profilePageFunctions.js

export const openEditor = (listing, setEditingId, setDraft, setShowListingMenu) => {
  setEditingId(listing._id);
  // Fecha o menu ao abrir o editor (opcional)
  if (setShowListingMenu) setShowListingMenu(null);

  if (listing.type === "blog") {
    setDraft({
      type: "blog",
      blogTitle: listing.blogTitle || "",
      blogContent: listing.blogContent || "",
      imageUrl: listing.imageUrl || "",
    });
  } else if (listing.type === "image") {
    setDraft({
      type: "image",
      imageUrl: listing.imageUrl || "",
      caption: listing.caption || "",
    });
  } else if (listing.type === "poll") {
    setDraft({
      type: "poll",
      question: listing.poll?.question || "",
      options: Array.isArray(listing.poll?.options) ? listing.poll.options : [],
    });
  } else {
    // fallback genérico
    setDraft({ type: listing.type || "unknown" });
  }
};

export const saveEdit = async (
  listingId,
  draft,
  setUserListings,
  setEditingId,
  setDraft,
  setShowListingMenu,
  baseURL = process.env.REACT_APP_API_BASE_URL
) => {
  console.log("função para editar listagem alcançada")
  try {
    const res = await fetch(`${baseURL}/api/listings/edit/${listingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(draft),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao editar");

    // Se sua API retorna { updatedListing }, mantenha:
    const updated = data.updatedListing || data.listing || data; // cobre diferentes formatos

    setUserListings(prev =>
      prev.map(item => (item._id === listingId ? { ...item, ...updated } : item))
    );

    setEditingId(null);
    setDraft({});
    if (setShowListingMenu) setShowListingMenu(null);
  } catch (err) {
    console.error(err);
    alert(err.message || "Erro ao editar");
  }
};

export const cancelEdit = (setEditingId, setDraft) => {
  setEditingId(null);
  setDraft({});
};

