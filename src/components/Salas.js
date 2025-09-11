import { useState, useEffect } from "react";
import "../styles/style.css";
import "../styles/rooms.css";
import { useNavigate } from "react-router-dom";
import { uploadImageToS3 } from "../utils/s3Upload"; // Importing your S3 upload utility
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

import { handleCreateRoom } from "./functions/liveRoomFunctions";

import NewChat from "../assets/icons/newchatIcon";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const Salas = () => {
  const { currentUser } = useUser();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [roomTitle, setRoomTitle] = useState("");
  const [roomImageFile, setRoomImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(true);

  // Fetch rooms from backend on component mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/rooms`, {
          method: "GET",
          credentials: "include", // Include credentials (if applicable)
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching rooms: ${response.statusText}`);
        }

        const data = await response.json();
        // normaliza: se backend não mandar isLive, derive de speakers
        const normalized = (data || []).map((r) => ({
          ...r,
          isLive:
            typeof r.isLive === "boolean"
              ? r.isLive
              : !!(r.currentUsersSpeaking && r.currentUsersSpeaking.length),
        }));
        setRooms(normalized);
        // console.log("Fetched rooms:", data); // Log fetched rooms
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms(); // Call the function to fetch rooms
  }, []); // Empty dependency array to ensure fetch only runs once on mount

  // 🔔 Ouve mudanças de live via socket e atualiza o array
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const onLive = ({ roomId, isLive, speakersCount }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId ? { ...r, isLive, speakersCount } : r
        )
      );
    };
    socket.on("room:live", onLive);
    return () => socket.off("room:live", onLive);
  }, [socket]);

  // Toggle modal visibility
  const toggleModal = () => {
    const modal = document.getElementsByClassName("modal")[0];
    const isModalOpen = modal.style.display === "block";

    if (isModalOpen) {
      modal.style.display = "none";
      document.body.style.overflow = ""; // Desbloqueia scroll
    } else {
      modal.style.display = "block";
      document.body.style.overflow = "hidden"; // Bloqueia scroll
    }
  };

  // Handle file selection
  const handleSelectImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      setRoomImageFile(file);
    }
  };

  const openLive = (sala) => {
    if (currentUser) {
      console.log("Opening live room:", sala);
      navigate(`/liveRoom/${sala._id}`, { state: { sala } });
    } else {
      window.alert("Por favor fazer login para acessar a sala");
      return;
    }
  };

  return (
    <div className="landingLivesContainer">
      {/* Modal for creating a new room */}

      {modal && (
        <div className="modal" style={{ display: "none" }}>
          <div className="newRoomContainer">
            <form className="newRoomForm" onSubmit={(e) => e.preventDefault()}>
              <div onClick={toggleModal} className="closeModalButtonContainer">
                X
              </div>

              {/* Image file input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleSelectImage}
                style={{ display: "none" }}
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="imageUploadLabel">
                <div
                  className="selectedImageContainer"
                  style={{
                    backgroundImage: roomImageFile
                      ? `url(${URL.createObjectURL(roomImageFile)})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                  }}
                >
                  {!roomImageFile && <div className="circlePlaceholder"></div>}
                </div>
              </label>
              <input
                className="nomeDaSala"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="Enter room title"
              />

              <div
                className="button"
                onClick={() =>
                  handleCreateRoom({
                    roomTitle,
                    roomImageFile,
                    setIsLoading,
                    uploadImageToS3,
                    currentUser,
                    setRooms,

                    toggleModal,
                    setRoomTitle,
                    setRoomImageFile,
                    openLive,
                  })
                }
              >
                <p>{isLoading ? "Criando Sala..." : "Criar Sala"}</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Button to open the modal */}
      <div className="landingLiveNewRoomContainer" onClick={toggleModal}>
        <NewChat className="newChatICon" />
      </div>

      {/* Mapping through fetched rooms (following the openLiveRooms pattern) */}
      {rooms.length > 0 ? (
        rooms.map((sala, index) => (
          <div
            key={index}
            className="landingLiveContainer"
            onClick={() => openLive(sala)}
          >
            {/* div for the image */}
            <div
              className={`landingLiveImage ${sala.isLive ? "neon" : ""}`} // 👈 pinta neon
              style={{
                backgroundImage: `url(${sala.roomImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {" "}
            </div>

            {/* div for the room title */}
            <div className="landingLiveTitle">
              <p className="roomTitleText">{sala.roomTitle}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No rooms available. Please create one!</p>
      )}
    </div>
  );
};

export default Salas;
