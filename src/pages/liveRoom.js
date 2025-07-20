import React, { useEffect, useState, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { useRoom } from "../context/RoomContext.js";
import { useSocket } from "../context/SocketContext.js";
import Header from "../components/Header.js";
import ChatComponent from "../components/ChatComponent.js";
import { updateRoomTitle, deleteRoom } from "./functions/liveFuncitons.js";
import "../styles/style.css";
import "../styles/liveRoom.css";
import VoiceComponent from "../components/VoiceComponent.js";
import { handleBack } from "../components/functions/headerFunctions.js";
import AudioContext from "../context/AudioContext.js";
// import { handleLeaveRoom } from "./functions/liveRoomFunctions.js";

import {
  addCurrentUserInRoom,
  removeCurrentUserInRoom,
  fetchCurrentRoomUsers,
} from "./functions/liveRoomFunctions.js";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const LiveRoom = () => {
  const socket = useSocket();
  const { currentUser } = useUser();
  const {
    minimizeRoom,
    joinRoomListeners,
    emitLeaveRoom,
    currentUsersSpeaking,
    setCurrentUsersSpeaking,
    removeSpeaker,
    currentUsers, // ✅ já incluído aqui
    handleJoinRoom,
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

  const { handleLeaveRoom } = useRoom(); // ✅ CERTA

  const [chatFocus, setChatFocus] = useState(false);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const handleFocus = () => setIsKeyboardOpen(true);
  const handleBlur = () => setIsKeyboardOpen(false);

  // const { currentUsers } = useRoom()
  console.log("currentUsers:", currentUsers);

  // acionar socket para adicionar usuario na sala
  // useEffect(() => {
  //   if (!roomId || !currentUser) return;
  //   console.log("👥 Adicionando usuário à currentUsersInRoom");
  //   addCurrentUserInRoom(roomId, currentUser, baseUrl);
  //   console.log("🐶 usuarios na sala:", currentUsers);
  // }, [roomId, currentUser]);

  useEffect(() => {
    if (!roomId || !currentUser) return;
    handleJoinRoom(roomId, currentUser, baseUrl);
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
    console.log("🔌 entrando na sala oficialmente");
    const user = currentUser;
    joinRoomListeners(roomId, user);
  }, [roomId, currentUser]);

  useEffect(() => {
    console.log("👥 Lista atual de ouvintes:", currentUsers);
  }, [currentUsers]);

  // App.js ou LiveRoom.js
useEffect(() => {
  const setAppHeight = () => {
    const height =
      window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };

  setAppHeight();

  // iOS Safari precisa escutar isso também:
  window.visualViewport?.addEventListener('resize', setAppHeight);
  window.addEventListener('resize', setAppHeight);

  return () => {
    window.visualViewport?.removeEventListener('resize', setAppHeight);
    window.removeEventListener('resize', setAppHeight);
  };
}, []);



  const handleUpdateRoomTitle = () =>
    updateRoomTitle(roomId, newRoomTitle, setSala);
  const handleDeleteRoom = () => deleteRoom(roomId, navigate);

  if (!sala && !roomId) return <p>Error: Room information is missing!</p>;

  return (
    <div className="liveRoomWrapper">
      <div className="topo">
        {/* header */}
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
          handleLeaveRoom={() =>
            handleLeaveRoom(
              roomId,
              currentUser,
              baseUrl,
              leaveChannel,
              navigate
            )
          }
          showBackArrow={true}
        />
        {/* 50 - 7 = 43 roomTheme*/}
        <p className="roomTheme">{roomTheme}</p>

        {/* live room members container */}
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

        {/* inRoomUsers */}
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
      </div>

      <div className="fundo">
        <ChatComponent roomId={roomId} />
      </div>
    </div>
  );
};

export default LiveRoom;
