import { useState, useEffect, useRef, useContext } from "react";
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

  const { joinChannel, leaveChannel, toggleMicrophone, micState } =
    useContext(AudioContext);
  const { socket } = useSocket(); // 👈 ouvir room:live
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false); // 👈 estado local de live
  const [isSpeaker, setIsSpeaker] = useState(false); // 👈 controla se está no palco

  const { handleLeaveRoom } = useRoom(); // ✅ CERTA

  useJoinRoomEffect(roomId, currentUser, handleJoinRoom, baseUrl);
  useFetchRoomDataEffect(
    roomId,
    currentUser,
    setSala,
    setNewRoomTitle,
    setIsCreator,
    baseUrl,
    setCurrentUsersSpeaking
  );
  useJoinRoomListenersEffect(roomId, currentUser, joinRoomListeners);
  useDebugCurrentUsersEffect(currentUsers);

  // Atualiza isLive quando carregar os dados da sala
  useEffect(() => {
    if (sala && typeof sala.isLive === "boolean") setIsLive(sala.isLive);
  }, [sala]);
  // Ouve 'room:live' para esta sala
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    const onLive = ({ roomId: id, isLive }) => {
      if (id === roomId) setIsLive(isLive);
    };
    socket.on("room:live", onLive);
    return () => socket.off("room:live", onLive);
  }, [socket, roomId]);
  // checagem de permissão (owner/admin)
  const canStart = (() => {
    if (!currentUser || !sala) return false;
    const me = String(currentUser._id);
    if (String(sala.owner?._id) === me) return true;
    return (sala.admins || []).some((a) => String(a._id) === me);
  })();
  // ações
  const startLive = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/rooms/${roomId}/live/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      if (!res.ok) throw new Error("falha ao iniciar");
      // entra no canal de voz mutado por padrão
      await joinChannel(roomId, currentUser._id);
      setIsSpeaker(true);
      setIsLive(true); // otimismo; socket confirmará
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar o áudio.");
    }
  };
  const joinAsSpeaker = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/rooms/${roomId}/speakers/join`, {
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
  const leaveStage = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/rooms/${roomId}/speakers/leave`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      if (!res.ok) throw new Error("falha ao descer do palco");
      await leaveChannel(roomId);
      setIsSpeaker(false);
    } catch (e) {
      console.error(e);
      alert("Não foi possível descer do palco.");
    }
  };

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
      setIsLoading(false);
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

  console.log("isLive?", isLive);

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
              navigate,
              sala?.owner?._id,
              isSpeaker
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

        {/* 🔘 Barra de controles de áudio */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {canStart && !isLive && (
            <button onClick={startLive}>Iniciar sala de áudio</button>
          )}
          {isLive && !isSpeaker && (
            <button onClick={joinAsSpeaker}>Subir ao palco (mic mutado)</button>
          )}
          {isSpeaker && (
            <>
              <button
                onClick={() =>
                  toggleMicrophone(!micState, currentUser._id, roomId)
                }
              >
                {micState ? "Desligar mic" : "Ligar mic"}
              </button>
              <button onClick={leaveStage}>Descer do palco</button>
            </>
          )}
        </div>

        {isLive && (
          <>
            <Speakers />
            <Listeners />
            <VoiceComponent
              microphoneOn={microphoneOn}
              roomId={roomId}
              keepAlive={true}
              setCurrentUsersSpeaking={setCurrentUsersSpeaking}
            />
          </>
        )}
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
