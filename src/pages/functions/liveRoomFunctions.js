let socket;

// Function to leave the room completely
export const handleLeaveRoom = async (
  setIsLeaving,
  sala,
  roomId,
  currentUser,
  baseUrl,
  leaveRoom,
  minimizeRoom,
  setRoomMembers,
  leaveChannel,
  roomMembers,
  navigate
  // setIsLeaving
) => {
  console.log("saindo da sala");
  setIsLeaving(true);

  // Emit an event to leave the room
  socket.emit("leaveRoom", {
    roomId: sala?._id || roomId,
    userId: currentUser._id,
  });

  // ✅ Remover o membro do MongoDB
  try {
    await fetch(`${baseUrl}/api/rooms/removeMember`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId: sala?._id || roomId,
        userId: currentUser._id,
      }),
    });
    console.log("Usuário removido do banco de dados");
  } catch (error) {
    console.error("Erro ao remover usuário do banco:", error);
  }

  leaveRoom();

  // Remover a sala minimizada quando o usuário sair da sala
  minimizeRoom(null); // Isso limpa a sala minimizada do contexto
  console.log("Sala minimizada removida do contexto");

  // Update roomMembers state to remove the current user locally
  setRoomMembers((prevMembers) =>
    prevMembers.filter((member) => member._id !== currentUser._id)
  );

  if (roomMembers.length === 1) {
    socket.emit("endLiveSession", { roomId });
  }

  try {
    // leave the Agora channel or any related voice channel
    await leaveChannel();
    // disconnect the socket and navigate away
    socket.disconnect();
    socket = null;

    navigate("/");
  } catch (error) {
    console.error("Error leaving the voice call:", error);
  }
};

// adicionar live users da sala no banco de dados
// adicionar live users da sala no banco de dados
export const addCurrentUserInRoom = async (roomId, currentUser, baseUrl) => {
  if (!roomId || !currentUser || !currentUser._id) {
    console.error("Room ID e dados do usuário são obrigatórios.");
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/rooms/addCurrentUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        user: {
          _id: currentUser._id,
          username: currentUser.username,
          profileImage: currentUser.profileImage,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Usuário adicionado à lista de usuários atuais da sala.");

      // necessario para mostrar usuarios online no app...
      if (window.socket) {
        window.socket.emit("joinRoom", { roomId });
      }

      return data.currentUsersInRoom;
    } else {
      console.error("Erro ao adicionar usuário:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Erro na requisição para adicionar usuário atual:", error);
    return null;
  }
};


// remover current user online da sala do banco de dados
// remover current user online da sala do banco de dados
// remover current user online da sala do banco de dados
export const removeCurrentUserInRoom = async (roomId, userId, baseUrl) => {
  if (!roomId || !userId) {
    console.error(
      "❌ Falta roomId ou userId ao tentar remover usuário da sala."
    );
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/rooms/removeCurrentUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(
        "✅ Usuário removido de currentUsersInRoom com sucesso:",
        data
      );

      // Emitir evento para outros clientes atualizarem a UI
      if (window.socket && window.socket.connected) {
        window.socket.emit("userLeavesRoom", { roomId });
        console.log("📤 Evento 'userLeavesRoom' emitido para room:", roomId);
      } else {
        console.warn("⚠️ Socket não conectado no momento de emitir 'userLeavesRoom'");
      }
    } else {
      console.error(
        "❌ Erro ao remover usuário:",
        data.error || "Erro desconhecido"
      );
    }
  } catch (error) {
    console.error("❌ Erro na requisição para remover usuário:", error);
  }
};



// buscar usuarios atuais na sala
// buscar usuarios atuais na sala
export const fetchCurrentRoomUsers = async (roomId, baseUrl) => {
  console.log("🧲 fetching currentUsers");
  try {
    const response = await fetch(`${baseUrl}/api/rooms/${roomId}/currentUsers`);
    if (!response.ok) {
      throw new Error("Failed to fetch current users");
    }
    const data = await response.json();
    return data.currentUsersInRoom; // <- retorna só a lista
  } catch (error) {
    console.error("Erro ao buscar usuários atuais na sala:", error);
    return [];
  }
};

