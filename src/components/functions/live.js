// Function to open the settings modal
export const openLiveSettings = (setShowModal) => {
  setShowModal(true); // Show the modal when the settings icon is clicked
};

// Function to close the settings modal
export const closeModal = (setShowModal) => {
  setShowModal(false); // Close the modal
};

// Function to update room title using fetch
export const updateRoomTitle = async (roomId, newTitle, setRoomTitle) => {
  console.log("test");
  console.log("roomId", roomId);
  console.log("newTitle", newTitle);
  console.log("setNewTitle", setRoomTitle);

  try {
    // Define API URL based on the environment
    const apiUrl =
      process.env.NODE_ENV === "production"
        ? `https://cristaosbackend.onrender.com/api/rooms/update/${roomId}`
        : `http://localhost:5001/api/rooms/update/${roomId}`; // Local development URL

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newTitle }),
    });

    if (!response.ok) {
      throw new Error("Failed to update room title");
    }

    const data = await response.json();
    setRoomTitle(data.room.roomTitle); // Update the room title locally
    console.log("Room title updated successfully:", data.room.roomTitle);
  } catch (error) {
    console.error("Failed to update room title:", error);
  }
};

// Function to delete a room using fetch
export const deleteRoom = async (roomId, navigate) => {
  try {
    const response = await fetch(`/api/rooms/delete/${roomId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete room");
    }

    console.log("Room deleted successfully");
    navigate("/"); // Navigate to the landing page after deletion
  } catch (error) {
    console.error("Failed to delete room:", error);
  }
};
