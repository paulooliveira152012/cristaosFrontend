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
    navigate,
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