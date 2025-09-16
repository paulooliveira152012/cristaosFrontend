import React, { useState, useContext, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
// context
import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext";
import { useAudio } from "../context/AudioContext";
import { useSocket } from "../context/SocketContext";

// components
import Header from "../components/Header";
import Speakers from "../components/liveRoom/roomScreen/SpeakersComponent";
import Listeners from "../components/liveRoom/roomScreen/ListenersComponent";
import VoiceComponent from "../components/VoiceComponent";
import ChatComponent from "../components/ChatComponent";
// functions
import {
  fetchRoomData,
  joinRoomEffect, //add user to room
  joinAsSpeaker, //add user as speaker
  verifyCanStartLive, //verify if can start live
  leaveStage, //remove user from speakers
} from "./functions/liveRoomFunctions2";
import { handleBack } from "../components/functions/headerFunctions";

import { useNavigate } from "react-router-dom";

const LiveRoomNew = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

  // =============== variaveis contextuais
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const {
    startLive,
    minimizeRoom,
    joinRoomListeners,
    setCurrentUsersSpeaking,
    currentUsers, // ✅ já incluído aqui
    handleJoinRoom,
    handleLeaveRoom,
    roomReady,
  } = useRoom();

  const { joinChannel, leaveChannel, toggleMicrophone, micState } = useAudio();

  const { roomId } = useParams();

  // =============== funcionalidades react
  const navigate = useNavigate();
  const location = useLocation();

  // =============== Variaveis locais
  const [sala, setSala] = useState(location.state?.sala || null);
  const [isCreator, setIsCreator] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false); // 👈 controla se está no palco
  const [roomTheme, setRoomTheme] = useState(
    sala?.roomTitle ? `bem vindo a sala ${sala.roomTitle}` : "Carregando sala…"
  );
  const [canStartRoom, setCanStartRoom] = useState(false); //can start the room?
  const [isLive, setIsLive] = useState(false);
  const isRejoiningRef = useRef(false); //user is rejoining?
  const [microphoneOn, setMicrophoneOn] = useState(false);

  // =============== useEffects
  // fetchRoomData
  useEffect(() => {
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
    const userId = currentUser._id;
    console.log("chamando fetchRoomData com", roomId, currentUser, baseUrl);
    fetchRoomData({ roomId, userId, baseUrl, setSala }); //fetch room data
    console.log("sala:", sala);
    joinRoomEffect({ roomId, currentUser, handleJoinRoom, baseUrl }); //join
  }, [roomId, currentUser?._id]);

  // verifications
  useEffect(() => {
    verifyCanStartLive(currentUser, sala, setCanStartRoom);
  }, [currentUser?._id, sala?.roomTitle]);

  // Sempre verificar status da sala com backend
  useEffect(() => {
    console.log("✅ sala atualizada:", sala);
    setIsLive(sala.isLive);
  }, [sala]);

  console.log("currentUser:", currentUser);
  console.log("sala:", sala);

  return (
    <div className="screenWrapper">
      <div className="liveRoomContent">
        <Header
          navigate={navigate}
          showProfileImage={false}
          showLeaveButton={true}
          handleLeaveRoom={() =>
            handleLeaveRoom({
              roomId,
              user: currentUser,
              baseUrl,
              leaveChannel,
              navigate,
              ownerId: sala?.owner?._id,
              isSpeaker,
            })
          }
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
          } // faz o BackArrow sair corretamente
          roomId={roomId}
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

        {/* 🔘 Barra de controles de áudio para inicialização de sala */}
        <div
          style={{
            // display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {canStartRoom && !isLive && (
            <button
              onClick={() =>
                startLive({
                  roomId,
                  baseUrl,
                  currentUser,
                  roomId,
                  joinChannel,
                  setIsSpeaker,
                  setIsLive,
                })
              }
            >
              Iniciar sala de áudio
            </button>
          )}

          {/* speakers */}
          <Speakers />
          {/* listeners */}
          <Listeners />
          {/* voice */}
          <VoiceComponent />


          {isLive && !isSpeaker && (
            <button
              onClick={() =>
                joinAsSpeaker(joinChannel, roomId, currentUser, setIsSpeaker)
              }
            >
              Subir ao palco (mic mutado)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveRoomNew;
