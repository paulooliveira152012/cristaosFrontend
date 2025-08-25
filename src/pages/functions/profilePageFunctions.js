const baseUrl = process.env.REACT_APP_API_BASE_URL;

// em algum utils central, se quiser (opcional)
const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  const h = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

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
  console.log(`buscando lista de amigos do usuário ${userId}`)
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
      headers: authHeaders(),
      body: JSON.stringify({ requested }),
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      console.warn("sendChatRequest falhou:", response.status, txt);
      if (response.status === 401) {
        // opcional: UX melhor
        alert("Sua sessão expirou. Faça login novamente.");
      }
      return null;
    }

    const data = await response.json();
    console.log("sendChatRequest OK:", data);
    return data;  

  } catch (error) {
    console.error("Erro ao pedir conversa:", error);
    return null;
  }
};

// profilePageFunctions.js

export const openEditor = (
  listing,
  setEditingId,
  setDraft,
  setShowListingMenu
) => {
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
  console.log("função para editar listagem alcançada");
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

    setUserListings((prev) =>
      prev.map((item) =>
        item._id === listingId ? { ...item, ...updated } : item
      )
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

export const submitMuralContent = async (
  currentUserId,
  userId,
  newMuralMessage
) => {
  console.log(
    `${currentUserId} submiting a new message to ${userId}: ${newMuralMessage}`
  );

  try {
    const response = await fetch(
      `${baseUrl}/api/mural/newMuralMessage/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          senderId: currentUserId,
          text: newMuralMessage,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Erro ao enviar pedido.");
    return data;
  } catch (error) {
    console.error("Erro ao escrever algo no mural:", error);
    return { error: error.message };
  }
};

export const getMuralContent = async (userId) => {
  console.log("fetching mural conten...");

  const res = await fetch(`${baseUrl}/api/mural/getMuralContent/${userId}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  console.log("mural content:", data);
  if (!res.ok) throw new Error(data.message || `Erro (HTTP ${res.status})`);

  // esperado: { items, page, limit, total, hasMore }
  return data;
};

export const handleSaveBio = async (bioDraft) => {
  console.log("Saving bio...", bioDraft);
  console.log("baseUrl:", baseUrl)

  try {
    const res = await fetch(`${baseUrl}/api/users/saveBio`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify({ bio: bioDraft }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao salvar bio.");

    console.log("Bio salva com sucesso:", data);
  } catch (error) {
    console.log("Erro ao salvar bio:", error);
  }
}

// implemente um uploader simples (ajuste a URL conforme sua API)
  // uploader simples (ajuste apiUrl se preciso)
  // 1) Fazer upload e RETORNAR a URL (sem setar estado aqui)
export const uploadCover = async (file) => {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${baseUrl}/api/profile/coverImage`, {
    method: "PUT",
    body: fd,
    credentials: "include",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Falha no upload (${res.status}) ${t}`);
  }
  const { url } = await res.json();
  if (!url) throw new Error("Resposta sem URL");
  return url;
};

export const coverSelected = async (e, setUploading, setUser) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type?.startsWith("image/")) {
    alert("Escolha um arquivo de imagem."); e.target.value = ""; return;
  }
  if (file.size > 7 * 1024 * 1024) {
    alert("Imagem muito grande (máx 7MB)."); e.target.value = ""; return;
  }

  try {
    setUploading(true);
    const url = await uploadCover(file);
    // use UM campo consistente com o resto do app/banco:
    setUser((u) => (u ? { ...u, profileCoverImage: url } : u));
  } catch (err) {
    console.error(err);
    alert("Falha ao enviar a imagem.");
  } finally {
    setUploading(false);
    e.target.value = ""; // permite selecionar o mesmo arquivo novamente
  }
};