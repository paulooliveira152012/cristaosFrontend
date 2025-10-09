import { uploadImageToS3 } from "../../utils/s3Upload";
const apiUrl = process.env.REACT_APP_API_BASE_URL;

export const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",        // 👈 obrigatório p/ body JSON
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};


// =============================================================
// functions related to creating rooms MODAL
// =============================================================

// =================== fetch all rooms
export const fetchRooms = async () => {
  // console.log("✅ fetching all rooms...");
  try {
    const response = await fetch(`${apiUrl}/api/rooms`, {
      // especificando o metodo
      method: "GET",
    });

    // Lê o corpo da resposta (JSON) e faz parse para objeto JavaScript
    const data = await response.json();

    // console.log("✅ ✅  response:", data);

    // devolve os dados para quem chamou a função
    return data;
  } catch (err) {
    console.log("error:", err);
  }
};

export const openLive = ({ currentUser, sala, navigate }) => {
  if (currentUser) {
    // console.log("Opening live room:", sala);
    navigate(`/liveRoomNew/${sala._id}`, { state: { sala } });
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
  setShowModal,
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
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(roomData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Room created successfully:", result);

      // Update rooms state with the new room
      setRooms((prevRooms) => [...prevRooms, result]);

      // Close the modal
      //   toggleModal();
      setShowModal(false);

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

// fetch room data
// mais simples: recebe um objeto e RETORNA os dados
export const fetchRoomData = async ({ roomId, userId, baseUrl, setSala }) => {
  console.log("fetching sala...");
  if (!roomId || !userId || !baseUrl) {
    console.log("🚨 roomId:", roomId, "userId:", userId, "baseUrl:", baseUrl);
    return null;
  }

  const res = await fetch(`${baseUrl}/api/rooms/fetchRoomData/${roomId}`, {
    credentials: "include",
  });
  const data = await res.json();
  setSala(data);

  if (!res.ok) {
    console.error(
      "Erro ao buscar dados da sala:",
      data?.error || "desconhecido"
    );
    return null;
  }

  return data; // { roomTitle, createdBy, speakers, ... }
};

// add user to room automatically at room enter
export const joinRoomEffect = ({
  roomId,
  currentUser,
  handleJoinRoom,
  baseUrl,
}) => {
  console.log("joining room...");
  if (!roomId || !currentUser || !baseUrl) {
    console.log(
      "🚨 missing roomId",
      roomId,
      "or currentUser",
      currentUser,
      "or baseUrl:",
      baseUrl
    );
    return;
  }
  handleJoinRoom(roomId, currentUser, baseUrl);
};

// add user to speaker list
export const joinAsSpeaker = async (
  joinChannel,
  roomId,
  currentUser,
  setIsSpeaker
) => {
  console.log("joining speakers...");
  if (!roomId || !currentUser) {
    console.log("missing roomId or currentUser");
    return;
  }
  try {
    const res = await fetch(`${apiUrl}/api/rooms/${roomId}/speakers/join`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id }),
    });
    if (!res.ok) throw new Error("falha ao subir ao palco");
    await joinChannel(roomId, currentUser._id);
    setIsSpeaker(true);
  } catch (e) {
    console.error(e);
    alert("Não foi possível subir ao palco.");
  }
};

export const verifyCanStartLive = (currentUser, sala, setCanStartRoom) => {
  if (!currentUser || !sala) return false;
  const me = String(currentUser._id);
  if (me) {
    setCanStartRoom(true);
  }
  if (String(sala.owner?._id) === me) return true;
  return (sala.admins || []).some((a) => String(a._id) === me);
};

export const leaveStage = async (roomId, currentUser) => {
  console.log("leaveStage function external");
  console.log("roomId:", roomId);
  console.log("currentUser:", currentUser);

  try {
    const res = await fetch(`${apiUrl}/api/rooms/${roomId}/speakers/leave`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser._id }),
    });
    if (!res.ok) throw new Error("falha ao descer do palco");
    // await leaveChannel(roomId);
    // setIsSpeaker(false);
  } catch (e) {
    console.error(e);
    alert("Não foi possível descer do palco.");
  }
};

export async function updateRoomSettingsJson(
  baseUrl,
  roomId,
  { title, coverUrl }
) {
  const res = await fetch(`${baseUrl}/api/rooms/update/${roomId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      ...(title ? { newTitle: title } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Falha ao atualizar sala: ${res.status} - ${txt}`);
  }
  const data = await res.json();
  return data.room;
}

export const deleteRoom = async (roomId, navigate) => {
  try {
    const response = await fetch(`${apiUrl}/api/rooms/delete/${roomId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete room. Status: ${response.status}`);
    }

    console.log("Room deleted successfully");
    navigate("/"); // Navigate to the landing page after deletion
  } catch (error) {
    console.error("Error deleting room:", error.message || error);
  }
};

export async function handleSaveSettings({
  baseUrl,
  roomId,
  title,
  coverFile,
}) {
  let coverUrl;
  if (coverFile) {
    coverUrl = await uploadImageToS3(coverFile); // sobe no front e pega URL final
  }
  const room = await updateRoomSettingsJson(baseUrl, roomId, {
    title,
    coverUrl,
  });
  return room;
}

// saaveChanges
// 1) mantenha só ESTA função de salvar:
export const onSaveSettings = async ({
  setIsLoading,
  baseUrl,
  roomId,
  newRoomTitle,
  newCoverFile,
  setSala,
  setRoomTheme,
  setShowSettingsModal,
  setNewCoverFile,
}) => {
  console.log("saving room updates...");
  try {
    setIsLoading(true); // <- liga overlay
    const updatedRoom = await handleSaveSettings({
      baseUrl,
      roomId,
      title: newRoomTitle,
      coverFile: newCoverFile,
    });
    setSala(updatedRoom);
    setRoomTheme(`bem vindo a sala ${updatedRoom?.roomTitle}`);
    setShowSettingsModal(false);
    setNewCoverFile(null);
  } catch (err) {
    console.error(err);
    alert("Não foi possível atualizar a sala.");
  } finally {
    setIsLoading(false);
  }
};

// deleteRoom
export const handleDeleteRoom = (roomId, navigate) => deleteRoom(roomId, navigate);
