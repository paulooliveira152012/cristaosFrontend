import socket from "../../socket";

// Function to handle logout and navigation
export const handleLogout = (logout, navigate) => {
  logout(); // Clear the user from context (logout)
  navigate('/');
};

// Function to handle back navigation
// Function to handle back navigation
export const handleBack = (
  navigate, 
  socket, 
  roomId, 
  userId, 
  minimizeRoom, 
  sala,
  isRejoiningRef, // Pass the ref here instead of setIsRejoining
  microphoneOn
) => {
  console.log("Navigating back...");

  // Emit minimizeRoom event to the server with microphone state
  if (socket && socket.connected && roomId && userId) {
    socket.emit("minimizeRoom", { roomId, userId, microphoneOn });
    console.log(`Minimized room ${roomId} for user ${userId} with microphone state: ${microphoneOn}`);
  } else {
    console.warn("Socket is not connected or room/user information is missing.");
  }

  // Minimize the room using the RoomContext function and pass the microphone state
  if (typeof minimizeRoom === "function" && sala) {
    minimizeRoom(sala, microphoneOn); // Pass the room data and microphone state
    console.log(`Room "${sala?.roomTitle}" minimized with microphone state: ${microphoneOn}`);
  } else {
    console.warn("Unable to minimize room. Either minimizeRoom is not a function or sala is missing.");
  }

  // Set the isRejoining flag to true by updating the ref
  if (isRejoiningRef && isRejoiningRef.current !== undefined) {
    isRejoiningRef.current = true; // Update the ref directly
    console.log("isRejoining set to true");
  } else {
    console.warn("isRejoiningRef is not defined correctly.");
  }

  // Navigate back to the main page without disconnecting the call
  console.log("Attempting to navigate back to '/'");
  navigate("/");
};


export const handleLeaveDirectMessagingChat = async ({
  conversationId,
  userId,
  username,
  navigate,
}) => {
  console.log("conversationId:", conversationId, "userId:", userId);

  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/dm/leaveChat/${conversationId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!res.ok) throw new Error("Erro ao sair da conversa");

    const data = await res.json();
    console.log("✅ Saiu da conversa:", data.message);

    // 🔴 Emitir saída via socket
    socket.emit("leavePrivateChat", {
      conversationId,
      userId,
      username,
    });

    // ✅ Navegar para home
    navigate("/");
  } catch (err) {
    console.error("Erro ao sair da conversa:", err);
  }
};
