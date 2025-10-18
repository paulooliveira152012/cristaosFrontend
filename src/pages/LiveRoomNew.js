import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../styles/liveRoom.css";
// context
import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext";
import { useAudio } from "../context/AudioContext";

// components
import Header from "../components/Header";
import Speakers from "../components/liveRoom/roomScreen/SpeakersComponent";
import Listeners from "../components/liveRoom/roomScreen/ListenersComponent";
import VoiceComponent from "../components/VoiceComponent";
import ChatComponent from "../components/ChatComponent";
import RoomMenuModal from "../components/liveRoom/RoomMenuModal";
// functions
import {
  joinAsSpeaker, //add user as speaker
  leaveStage, //remove user from speakers
  onSaveSettings,
  handleDeleteRoom,
} from "./functions/liveRoomFunctions2";
import { handleBack } from "../components/functions/headerFunctions";

import { useNavigate } from "react-router-dom";

const LiveRoomNew = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

  // =============== variaveis contextuais
  const { currentUser } = useUser();
  const {
    startLive,
    minimizeRoom,
    currentUsersSpeaking,
    setCurrentUsersSpeaking,
    handleJoinRoom,
    handleLeaveRoom,
    isCurrentUserSpeaker,
    room,
    isCreator,
    setRoomId,
    canStartRoom,
    setUserEnteringRoom
  } = useRoom();

  const { joinChannel, leaveChannel } = useAudio();
  const { roomId } = useParams();

  // console.log("isCreator do contexto na pagina:", isCreator)

  // =============== funcionalidades react
  const navigate = useNavigate();
  const location = useLocation();

  // =============== Variaveis locais
  const [sala, setSala] = useState(location.state?.sala || null);
  const { id: routeRoomId } = useParams(); // rota: /liveRoomNew/:id
  const [isSpeaker, setIsSpeaker] = useState(false); // 👈 controla se está no palco
  const [roomTheme, setRoomTheme] = useState(
    sala?.roomTitle ? `Bem vindo a sala ${sala.roomTitle}` : "Carregando sala…"
  );
  const isRejoiningRef = useRef(false); //user is rejoining?
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newCoverFile, setNewCoverFile] = useState(null); // File ou null

  const hasSpeakers =
    Array.isArray(currentUsersSpeaking) && currentUsersSpeaking.length > 0;

  // versão otimista: mostra se eu já sou speaker mesmo que a lista ainda não tenha sincronizado
  const showSpeakers = hasSpeakers || isCurrentUserSpeaker;
  // se quiser só quando o backend confirmar, use:
  // const showSpeakers = roomReady && hasSpeakers;

  // =============== useEffects

  //   useEffect(() => {
  //     console.log("SETTING ROOM ID TO CONTEXT FROM MAIN PAGE", routeRoomId)
  //   if (routeRoomId) setRoomId(routeRoomId);
  // }, [routeRoomId, setRoomId]);

  // console.log("room alimentado pelo RoomContext:", room)
  // console.log("roomId no liveRoomNew:", roomId)

  setRoomId(roomId);

  return (
    <div className="screenWrapper liveRoom">
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
        showSettingsIcon={canStartRoom}
        openLiveSettings={() => setShowSettingsModal(true)}
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

      {room?.isLive && (
        <Speakers />
      )}
      <Listeners />
      <ChatComponent roomId={roomId} />
      <VoiceComponent roomId={roomId} />
      {showSettingsModal && (
        <RoomMenuModal
          setShowSettingsModal={(v) => !isLoading && setShowSettingsModal(v)} // não fecha se loading
          newRoomTitle={newRoomTitle}
          setNewRoomTitle={setNewRoomTitle}
          handleUpdateRoomTitle={() =>
            onSaveSettings({
              setIsLoading,
              baseUrl,
              roomId,
              newRoomTitle,
              newCoverFile,
              setSala,
              setRoomTheme,
              setShowSettingsModal,
              setNewCoverFile,
            })
          }
          handleDeleteRoom={() => handleDeleteRoom(roomId, navigate)}
          onChooseCover={setNewCoverFile}
          currentCoverUrl={sala?.coverUrl || ""} // URL atual p/ preview
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default LiveRoomNew;
