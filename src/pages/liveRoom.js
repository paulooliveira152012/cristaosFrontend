import React, { useEffect, useState, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { useRoom } from "../context/RoomContext.js";
import Header from "../components/Header.js";
import ChatComponent from "../components/ChatComponent.js";
import { updateRoomTitle, deleteRoom } from "./functions/liveFuncitons.js";
import "../styles/style.css";
import VoiceComponent from "../components/VoiceComponent.js";
import { handleBack } from "../components/functions/headerFunctions.js";
import AudioContext from "../context/AudioContext.js";

import {
  addCurrentUserInRoom,
  removeCurrentUserInRoom,
  fetchCurrentRoomUsers,
} from "./functions/liveRoomFunctions.js";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const LiveRoom = () => {
  const { currentUser } = useUser();
  const {
    minimizeRoom,
    joinRoomListeners,
    emitLeaveRoom,
    currentUsersSpeaking,
    setCurrentUsersSpeaking,
    currentUsers, // ✅ já incluído aqui
  } = useRoom();

  const { leaveChannel } = useContext(AudioContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [sala, setSala] = useState(location.state?.sala || null);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [roomTheme, setRoomTheme] = useState(
    `bem vindo a sala ${sala?.roomTitle}`
  );
  const [isCreator, setIsCreator] = useState(false);
  const isRejoiningRef = useRef(false);

  // const { currentUsers } = useRoom()
  console.log("AQUI -->", currentUsers)

// acionar socket para adicionar usuario na sala
  useEffect(() => {
    if (!roomId || !currentUser) return;
    console.log("👥 Adicionando usuário à currentUsersInRoom");
    addCurrentUserInRoom(roomId, currentUser, baseUrl);
    console.log("🐶 usuarios na sala:", currentUsers)
  }, [roomId, currentUser]);

  // acionar busca de dados da sala
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId || !currentUser) return;
      try {
        const response = await fetch(
          `${baseUrl}/api/rooms/fetchRoomData/${roomId}`
        );
        const data = await response.json();
        if (response.ok) {
          setSala(data);
          setNewRoomTitle(data.roomTitle);
          setIsCreator(data.createdBy?._id === currentUser._id);
        } else {
          console.error(
            "Erro ao buscar dados da sala:",
            data.error || "Erro desconhecido"
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados da sala:", error);
      }
    };
    fetchRoomData();
  }, [roomId, currentUser]);

  // ✅ ENTRA NA SALA
  useEffect(() => {
    if (!roomId || !currentUser) return;
    console.log("🔌 entrando na sala oficialmente")
    const user = currentUser
    joinRoomListeners(roomId, user);
  }, [roomId, currentUser]);

  useEffect(() => {
  console.log("👥 Lista atual de ouvintes:", currentUsers);
}, [currentUsers]);


  const handleLeaveRoom = async () => {
    emitLeaveRoom(roomId, currentUser._id);
    try {
      await fetch(`${baseUrl}/api/rooms/removeMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: sala?._id || roomId,
          userId: currentUser._id,
        }),
      });
      console.log("Usuário removido do banco de dados");
    } catch (error) {
      console.error("Erro ao remover usuário do banco:", error);
    }
    await removeCurrentUserInRoom(roomId, currentUser._id, baseUrl);
    minimizeRoom(null);
    try {
      await leaveChannel();
      navigate("/");
    } catch (error) {
      console.error("Erro ao sair da call de voz:", error);
    }
  };

  const handleUpdateRoomTitle = () =>
    updateRoomTitle(roomId, newRoomTitle, setSala);
  const handleDeleteRoom = () => deleteRoom(roomId, navigate);

  if (!sala && !roomId) return <p>Error: Room information is missing!</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Header
        showProfileImage={false}
        showLogoutButton={false}
        showCloseIcon={true}
        onBack={() =>
          handleBack(
            navigate,
            null,
            roomId,
            currentUser?._id,
            minimizeRoom,
            sala,
            isRejoiningRef,
            microphoneOn
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
        <div className="liveInRoomMembersContainer">
          {currentUsersSpeaking.length > 0 ? (
            currentUsersSpeaking.map((member, index) => (
              <div key={index} className="liveMemberParentContainer">
                <div className="liveMemberContainer">
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
                {member.micOpen ? (
                  <span role="img">🎤</span>
                ) : (
                  <span role="img">🔇</span>
                )}
              </div>
            ))
          ) : (
            <p>Nenhum membro no palco.</p>
          )}
        </div>

        <div className="inRoomUsers">
          {currentUsers && currentUsers.length > 0 ? (
            currentUsers.map((member, index) => (
              <div key={member._id} className="inRoomMembersParentContainer">
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
          setCurrentUsersSpeaking={setCurrentUsersSpeaking}
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
