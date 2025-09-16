import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../styles/liveRoom.css";
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
    currentUsersSpeaking,
    setCurrentUsersSpeaking,
    currentUsers, // ✅ já incluído aqui
    handleJoinRoom,
    handleLeaveRoom,
    isCurrentUserSpeaker,
    roomReady,
    room,
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

  const isRejoiningRef = useRef(false); //user is rejoining?
  const [microphoneOn, setMicrophoneOn] = useState(false);

  const isLive = !!room?.isLive; // ⬅️ derive daqui

  const hasSpeakers =
    Array.isArray(currentUsersSpeaking) && currentUsersSpeaking.length > 0;

  // versão otimista: mostra se eu já sou speaker mesmo que a lista ainda não tenha sincronizado
  const showSpeakers = hasSpeakers || isCurrentUserSpeaker;
  // se quiser só quando o backend confirmar, use:
  // const showSpeakers = roomReady && hasSpeakers;

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

  // Ouve 'room:live' para esta sala
  // ================================= PARTE QUE ESTOU ME REFERINDO
  // useEffect(() => {
  //   socket.on("room:live");
  // }, [socket, roomId]);
  // ================================= FINAL DA PARTE QUE ESTOU REFERINDO

  // local function handlers

  // verificar se usuario atual ja e um falante
  console.log("showSpeakers", showSpeakers);

  return (
    <div className="screenWrapper liveRoom">
      <div className="liveRoomContent">
        <div className={isLive? "firstChildLiveOn" : "firstChild"}> {/* first shild open*/}
      
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
              isSpeaker: isCurrentUserSpeaker,
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

        <div className="roomTitleSpeakersButtons">
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
                    joinChannel,
                    setIsSpeaker,
                  })
                }
              >
                Iniciar sala de áudio
              </button>
            )}

            {/* speakers */}
            {/* speakers */}
            {showSpeakers && <Speakers />}
            {isCurrentUserSpeaker && (
              <button onClick={() => leaveStage(roomId, currentUser)}>
                Descer do palco
              </button>
            )}
          </div>

          {/* listeners */}
          <Listeners />
          {/* voice */}
          <VoiceComponent
            microphoneOn={microphoneOn}
            roomId={roomId}
            keepAlive={true}
            setCurrentUsersSpeaking={setCurrentUsersSpeaking}
          />


          {isLive && !isCurrentUserSpeaker && (
            <button
              onClick={() =>
                joinAsSpeaker(joinChannel, roomId, currentUser, setIsSpeaker)
              }
            >
              Subir ao palco (mic mutado)
            </button>
          )}
        </div>
        </div> {/* first shild close*/}
         <div className={isLive ? "secondChildLiveOn" : "secondChild"}>  {/* secondChild  open */}
        <ChatComponent roomId={roomId} />  {/* secondChild  close */}
        </div>
      </div>
    </div>
  );
};

export default LiveRoomNew;
