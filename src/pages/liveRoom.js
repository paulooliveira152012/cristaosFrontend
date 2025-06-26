import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import io from "socket.io-client";
import { useUser } from "../context/UserContext.js";
import { useRoom } from "../context/RoomContext.js";
import Header from "../components/Header.js";
import ChatComponent from "../components/ChatComponent.js";
import { updateRoomTitle, deleteRoom } from "./functions/liveFuncitons.js";
import "../styles/style.css";
import VoiceComponent from "../components/VoiceComponent.js";
import { handleBack } from "../components/functions/headerFunctions.js";
import { useContext } from "react";
import AudioContext from "../context/AudioContext.js";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

let socket;

const LiveRoom = () => {
  const { currentUser } = useUser();
  const { minimizeRoom } = useRoom();
  const { leaveChannel } = useContext(AudioContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [sala, setSala] = useState(location.state?.sala || null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [microphoneOn, setMicrophoneOn] = useState(false); // Microphone state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [roomTheme, setRoomTheme] = useState(
    `bem vindo a sala ${sala?.roomTitle}`
  );
  const [isCreator, setIsCreator] = useState(false);
  const isRejoiningRef = useRef(false);

  const [isRejoining, setIsRejoining] = useState(false); // or useRef if needed

  useEffect(() => {
    console.log("isRejoining?", isRejoining);

    const fetchRoomData = async () => {
      if (!roomId || !currentUser) return; // Ensure roomId and currentUser exist

      console.log("Fetching room data with roomId:", roomId);

      try {
        const response = await fetch(
          `${baseUrl}/api/rooms/fetchRoomData/${roomId}`
        );
        const data = await response.json();

        if (response.ok) {
          setSala(data); // Set room data
          setNewRoomTitle(data.roomTitle); // Set room title
          setIsCreator(data.createdBy?._id === currentUser._id); // Check if currentUser is the creator
        } else {
          console.error(
            "Error fetching room data:",
            data.error || "Unknown error"
          );
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData(); // Call the async function
  }, [roomId, currentUser]); // Run when roomId or currentUser changes

  useEffect(() => {
    if (!socket) return;

    const handleMicStatusChanged = ({ userId, micOpen }) => {
      console.log("	✅  Checking users with mic open");
      console.log(`Usuário ${userId} mudou mic para:`, micOpen);
      setRoomMembers((prev) =>
        prev.map((member) =>
          member._id === userId
            ? { ...member, micOpen, isSpeaker: member.isSpeaker }
            : member
        )
      );
      console.log("	✅ room members:", roomMembers);
    };

    socket.on("micStatusChanged", handleMicStatusChanged);

    return () => {
      if (socket) {
        socket.off("micStatusChanged", handleMicStatusChanged);
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !roomId || !sala) return;

    const joinRoomAndSyncToDB = async () => {
      if (!socket) {
        socket = io(baseUrl);
        console.log("Socket URL:", baseUrl);
        socket.currentRoomId = sala?._id || roomId;
      }

      // Set microphone state (rejoin logic)
      if (isRejoiningRef.current) {
        console.log("Rejoining room, keeping microphone state:", microphoneOn);
        isRejoiningRef.current = false;
      } else {
        console.log("First-time join, setting microphone to off.");
        setMicrophoneOn(false);
      }

      // Emit joinRoom via socket
      socket.emit("joinRoom", {
        roomId,
        user: {
          _id: currentUser._id,
          username: currentUser.username,
          profileImage: currentUser.profileImage,
        },
      });

      // Fallback: tenta buscar membros manualmente se roomMembers ainda não carregou após 800ms
      setTimeout(async () => {
        if (roomMembers.length === 0) {
          try {
            const res = await fetch(
              `${baseUrl}/api/rooms/getRoomMembers/${roomId}`
            );
            const data = await res.json();
            if (res.ok) {
              console.log("⏱️ Fallback: membros buscados manualmente:", data);
              setRoomMembers(data);
            }
          } catch (err) {
            console.error("Erro no fallback de roomMembers:", err);
          }
        }
      }, 500);

      console.log(
        "Emitting joinRoom event for room:",
        roomId,
        "with user:",
        currentUser.username
      );

      // ✅ Add user to DB if not already there
      try {
        const res = await fetch(`${baseUrl}/api/rooms/addMember`, {
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

        const data = await res.json();
        console.log("Banco de dados atualizado:", data);
      } catch (error) {
        console.error("Erro ao adicionar usuário ao banco de dados:", error);
      }

      // Socket listeners
      socket.on("userMinimized", ({ userId, minimized, microphoneOn }) => {
        if (userId === currentUser._id && minimized) {
          setMicrophoneOn(microphoneOn);
          isRejoiningRef.current = true;
          console.log(`Restaurando microfone: ${microphoneOn}`);
        }
      });

      socket.on("roomData", ({ roomMembers }) => {
        console.log("✅ ✅ ✅  roomData recebido:", roomMembers);
        setRoomMembers(roomMembers);
      });

      socket.on("userLeft", ({ userId }) => {
        console.log("User left:", userId);
        setRoomMembers((prev) => prev.filter((m) => m._id !== userId));
      });

      socket.on("connect", () => {
        console.log(`Socket conectado com ID: ${socket.id}`);
      });

      socket.on("disconnect", () => {
        console.log("Socket desconectado");
        setRoomMembers((prev) => prev.filter((m) => m._id !== currentUser._id));
      });

      socket.on("connect_error", (err) => {
        console.error("Erro de conexão:", err);
      });

      socket.on("connect_timeout", () => {
        console.error("Timeout de conexão");
      });
    };

    joinRoomAndSyncToDB(); // Chama a função async interna

    return () => {
      if (socket) {
        socket.off("roomData");
        socket.off("userMinimized");
        socket.off("userLeft");
        socket.off("connect");
        socket.off("disconnect");
      }
    };
  }, [currentUser, roomId, sala, microphoneOn]);

  // Function to toggle microphone
  const toggleMicrophone = () => {
    const newMicState = !microphoneOn;
    setMicrophoneOn(newMicState);

    // Emitir evento para o backend
    socket.emit("toggleMicrophone", {
      roomId: sala?._id || roomId,
      socketId: socket.id,
      microphoneOn: newMicState,
    });
  };

  const { leaveRoom } = useRoom();

  // Function to leave the room completely
  const handleLeaveRoom = async () => {
    console.log("saindo da sala");
    // setIsLeaving(true);

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

  if (!sala && !roomId) {
    return <p>Error: Room information is missing!</p>;
  }

  const handleUpdateRoomTitle = () =>
    updateRoomTitle(roomId, newRoomTitle, setSala);
  const handleDeleteRoom = () => deleteRoom(roomId, navigate);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header
        socket={socket}
        showProfileImage={false}
        showLogoutButton={false}
        showCloseIcon={true}
        onBack={() =>
          handleBack(
            // handleGoBack,
            navigate,
            socket,
            roomId,
            currentUser?._id,
            minimizeRoom,
            sala,
            isRejoiningRef, // Pass the ref here
            microphoneOn // Pass the microphone state here
          )
        }
        showSettingsIcon={isCreator}
        openLiveSettings={() => setShowSettingsModal(true)}
        roomId={roomId}
        handleLeaveRoom={handleLeaveRoom}
        showBackArrow={true}
      />

      <p
        style={{
          textAlign: "center",
          marginBottom: "10px",
          fontStyle: "italic",
        }}
      >
        {roomTheme}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflow: "hidden",
        }}
      >
        {/* Apenas usuários com na live */}
        <div className="liveInRoomMembersContainer">
          {roomMembers?.filter((member) => member.isSpeaker)?.length > 0 ? (
            roomMembers
              .filter((member) => member.isSpeaker)

              .map((member, index) => (
                <div key={index} className="liveMemberParentContainer">
                  <div className="liveMemberContainer">
                    <div className="liveMemberContent">
                      <Link to={`/profile/${member._id}`}>
                        <div
                          className="liveMemberProfileImage"
                          style={{
                            backgroundImage: `url(${
                              member.profileImage || ""
                            })`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundColor: "#ddd",
                            borderRadius: "40%",
                            cursor: "pointer",
                          }}
                        />
                      </Link>
                      <p className="liveRoomUsername">
                        {member.username || "Anonymous"}
                      </p>
                    </div>
                  </div>

                  {member.micOpen ? (
                    <span role="img" aria-label="Mic On">
                      🎤
                    </span>
                  ) : (
                    <span role="img" aria-label="Mic Off">
                      🔇
                    </span>
                  )}
                </div>
              ))
          ) : (
            <p>Nenhum membro no palco.</p>
          )}
        </div>

        {/* usuarios na sala: sem que estejam na live */}
        <div className="inRoomUsers">
          {roomMembers && roomMembers.length > 0 ? (
            roomMembers.map((member, index) => (
              <div key={index} className="inRoomMembersParentContainer">
                <div className="inRoomLiveMemberContainer">
                  <div className="liveMemberContent">
                    <Link to={`/profile/${member._id}`}>
                      <div
                        className="liveMemberProfileImage"
                        style={{
                          backgroundImage: `url(${member.profileImage || ""})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#ddd",
                          borderRadius: "40%",
                          cursor: "pointer",
                        }}
                      />
                    </Link>
                    <p className="liveRoomUsername">
                      {member.username || "Anonymous"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum membro na sala.</p>
          )}
        </div>

        <VoiceComponent
          microphoneOn={microphoneOn}
          roomId={roomId}
          keepAlive={true}
        />
        <ChatComponent roomId={roomId} />
      </div>

      {showSettingsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Room Settings</h2>
            <label htmlFor="newRoomTitle">Novo Titulo</label>
            <input
              type="text"
              id="newRoomTitle"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="Enter new room title"
            />
            <button onClick={handleUpdateRoomTitle}>Edit Room Title</button>
            <button onClick={handleDeleteRoom}>Delete Room</button>
            <button onClick={() => setShowSettingsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRoom;
