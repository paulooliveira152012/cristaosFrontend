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
  fetchRoomData,
  joinRoomEffect, //add user to room
  joinAsSpeaker, //add user as speaker
  verifyCanStartLive, //verify if can start live
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
  } = useRoom();

  const { joinChannel, leaveChannel } = useAudio();
  const { roomId } = useParams();

  console.log("isCreator do contexto na pagina:", isCreator)

  // =============== funcionalidades react
  const navigate = useNavigate();
  const location = useLocation();

  // =============== Variaveis locais
  const [sala, setSala] = useState(location.state?.sala || null);
  const [isSpeaker, setIsSpeaker] = useState(false); // 👈 controla se está no palco
  const [roomTheme, setRoomTheme] = useState(
    sala?.roomTitle ? `bem vindo a sala ${sala.roomTitle}` : "Carregando sala…"
  );
  const [canStartRoom, setCanStartRoom] = useState(false); //can start the room?
  const isRejoiningRef = useRef(false); //user is rejoining?
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const isLive = !!room?.isLive; // ⬅️ derive daqui
  // edit modal
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
    // console.log("chamando fetchRoomData com", roomId, currentUser, baseUrl);
    fetchRoomData({ roomId, userId, baseUrl, setSala }); //fetch room data
    // console.log("sala:", sala);
    joinRoomEffect({ roomId, currentUser, handleJoinRoom, baseUrl }); //join
  }, [roomId, currentUser?._id]);

  // verifications
  // useEffect(() => {
  //   verifyCanStartLive(currentUser, sala, setCanStartRoom);
  // }, [currentUser?._id, sala?.roomTitle]);

  // local function handlers
  // verificar se usuario atual ja e um falante
  // console.log("showSpeakers", showSpeakers);

  return (
    <div className="screenWrapper liveRoom">
      <div className="liveRoomContent">
        <div className={isLive ? "firstChildLiveOn" : "firstChild"}>
          {" "}
          {/* first shild open*/}
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
            showSettingsIcon={isCreator}
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
              { isCreator && !isLive && (
                <div className="startRoomButtonContainer"> <button 
                className="startRoomButton"
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
                </div>
              )}

              {/* speakers */}
              {/* speakers */}
              {showSpeakers && <Speakers />}
              {isCurrentUserSpeaker && (
                <button 
                  className="backToListenerBtn"
                  onClick={() => leaveStage(roomId, currentUser)}>
                  Descer do palco
                </button >
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
              className="joinSpeakers"
                onClick={() =>
                  joinAsSpeaker(joinChannel, roomId, currentUser, setIsSpeaker)
                }
              >
                Subir para falar
              </button>
            )}

          

          </div>
        </div>{" "}
        {/* first shild close*/}
        <div className={isLive ? "secondChildLiveOn" : "secondChild"}>
          {" "}
          {/* secondChild  open */}
          <ChatComponent roomId={roomId} /> {/* secondChild  close */}
        </div>
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
    </div>
  );
};

export default LiveRoomNew;
