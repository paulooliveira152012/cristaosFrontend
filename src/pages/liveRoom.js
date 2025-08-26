import { useState, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { useRoom } from "../context/RoomContext.js";
import { useSocket } from "../context/SocketContext.js";
import Header from "../components/Header.js";
import ChatComponent from "../components/ChatComponent.js";
// todas as logicas importadas
import {
  handleSaveSettings,
  updateRoomSettingsJson,
  deleteRoom,
  useJoinRoomEffect,
  useFetchRoomDataEffect,
  useJoinRoomListenersEffect,
  useDebugCurrentUsersEffect, 
} from "./functions/liveFuncitons.js";
import "../styles/style.css";
import "../styles/liveRoom.css";
import Speakers from "../components/liveRoom/SpeakersComponent.js";
import Listeners from "../components/liveRoom/ListenersComponent.js";
import RoomMenuModal from "../components/liveRoom/RoomMenuModal.js";
import VoiceComponent from "../components/VoiceComponent.js";
import { handleBack } from "../components/functions/headerFunctions.js";
import AudioContext from "../context/AudioContext.js";
import { motion, AnimatePresence } from "framer-motion";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const LiveRoom = () => {
  const { currentUser } = useUser();
  const {
    minimizeRoom,
    joinRoomListeners,
    setCurrentUsersSpeaking,
    currentUsers, // ✅ já incluído aqui
    handleJoinRoom,
    roomReady,
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
  const [newCoverFile, setNewCoverFile] = useState(null); // File ou null
  const [isLoading, setIsLoading] = useState(false)

  const { handleLeaveRoom } = useRoom(); // ✅ CERTA

  useJoinRoomEffect(roomId, currentUser, handleJoinRoom, baseUrl);
  useFetchRoomDataEffect(
    roomId,
    currentUser,
    setSala,
    setNewRoomTitle,
    setIsCreator,
    baseUrl
  );
  useJoinRoomListenersEffect(roomId, currentUser, joinRoomListeners);
  useDebugCurrentUsersEffect(currentUsers);

  // const { currentUsers } = useRoom()
  console.log("currentUsers:", currentUsers);

  // 1) mantenha só ESTA função de salvar:
const onSaveSettings = async () => {
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
    setIsLoading(false)
  }
};


  
  const handleDeleteRoom = () => deleteRoom(roomId, navigate);

  if (!sala && !roomId) return <p>Error: Room information is missing!</p>;

  if (!roomReady) {
    return (
      <div className="loadingContainer">
        <p>Entrando na sala...</p>
      </div>
    );
  }

  return (
    // 100vh
    <div className="screenWrapper">
      <div className="liveRoomContent">
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
        <p
          style={{
            textAlign: "center",
            marginBottom: "10px",
            fontStyle: "italic",
          }}
        >
          {roomTheme}
        </p>
        <Speakers />
        <Listeners />
        <VoiceComponent
          microphoneOn={microphoneOn}
          roomId={roomId}
          keepAlive={true}
          setCurrentUsersSpeaking={setCurrentUsersSpeaking}
        />
        <ChatComponent roomId={roomId} />
      </div>

      {showSettingsModal && (
        <RoomMenuModal
          setShowSettingsModal={(v) => !isLoading && setShowSettingsModal(v)} // não fecha se loading
          newRoomTitle={newRoomTitle}
          setNewRoomTitle={setNewRoomTitle} 
          handleUpdateRoomTitle={onSaveSettings} 
          handleDeleteRoom={handleDeleteRoom}
          onChooseCover={setNewCoverFile}
          currentCoverUrl={sala?.coverUrl || ""} // URL atual p/ preview
          isLoading={isLoading}    
        />
      )}
    </div>
  );
};

export default LiveRoom;
