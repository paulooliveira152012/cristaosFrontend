import { authHeaders } from "../Admin/functions/ReportFunctions";
const baseUrl = process.env.REACT_APP_API_BASE_URL;


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
    const response = await fetch(`${baseUrl}/api/rooms/update/${roomId}`, {
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

// ============== Creating. new room
// Handle creating the room
export const handleCreateRoom = async ({
  roomTitle,
  roomImageFile,
  setIsLoading,
  currentUser,
  uploadImageToS3,
  setRooms,
  toggleModal,
  setRoomTitle,
  setRoomImageFile,
  openLive,
}) => {
  if (!roomTitle || !roomImageFile) {
    alert("Por favor, forneça um título e selecione uma imagem.");
    return;
  }

  setIsLoading(true);

  try {
    // Upload image to S3
    const imageUrl = await uploadImageToS3(roomImageFile);
    console.log("Image uploaded to S3, URL:", imageUrl);

    // Prepare the room data
    const roomData = {
      roomTitle: roomTitle,
      roomImage: imageUrl,
      createdBy: currentUser,
    };

    // Send POST request to create a new room
    const response = await fetch(`${baseUrl}/api/rooms/create`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(roomData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Room created successfully:", result);

      // Update rooms state with the new room
      setRooms((prevRooms) => [...prevRooms, result]);

      // Close the modal
      toggleModal();

      // Reset the form
      setRoomTitle("");
      setRoomImageFile(null);
      // navigate imediatly to the created room
      // navigate(`/liveRoom/${result._id}`, { state: {userId: currentUser._id} })
      // navigate(`/liveRoom/${result._id}`)
      // call navigation function with result as parameter
      console.log("result is:", result);
      openLive(result);
    } else {
      console.error("Error creating the room:", response.statusText);
    }
  } catch (error) {
    console.error("Error during room creation:", error);
  } finally {
    setIsLoading(false);
  }
};
