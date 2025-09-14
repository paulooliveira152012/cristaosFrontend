const apiUrl = process.env.REACT_APP_API_BASE_URL;

export const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =============================================================
// functions related to creating rooms MODAL
// =============================================================

// =================== fetch all rooms
export const fetchRooms = async () => {
  console.log("✅ fetching all rooms...");
  try {
    const response = await fetch(`${apiUrl}/api/rooms`, {
      // especificando o metodo
      method: "GET",
    });

    // Lê o corpo da resposta (JSON) e faz parse para objeto JavaScript
    const data = await response.json();

    console.log("✅ ✅  response:", data);

    // devolve os dados para quem chamou a função
    return data;
  } catch (err) {
    console.log("error:", err);
  }
};

export const openLive = ({ currentUser, sala, navigate }) => {
  if (currentUser) {
    console.log("Opening live room:", sala);
    navigate(`/liveRoom/${sala._id}`, { state: { sala } });
  } else {
    window.alert("Por favor fazer login para acessar a sala");
    return;
  }
};

export const handleCreateRoom = async ({
  roomTitle,
  roomImageFile,
  setIsLoading,
  currentUser,
  uploadImageToS3,
  setRooms,
  setRoomTitle,
  setRoomImageFile,
  openLive,
  setShowModal
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
    const response = await fetch(`${apiUrl}/api/rooms/create`, {
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
    //   toggleModal();
        setShowModal(false)

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


// =============================================================
// functions related to creating rooms PAGE
// =============================================================

