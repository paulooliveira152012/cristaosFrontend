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
