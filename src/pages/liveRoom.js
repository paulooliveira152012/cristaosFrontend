import { useState, useRef, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext.js";
import { useRoom } from "../context/RoomContext.js";
import { useSocket } from "../context/SocketContext.js";
import Header from "../components/Header.js";
import ChatComponent from "../components/ChatComponent.js";
// todas as logicas importadas
import {
  updateRoomTitle,
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

  const handleUpdateRoomTitle = () =>
    updateRoomTitle(roomId, newRoomTitle, setSala);
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
          setShowSettingsModal={setShowSettingsModal}
          setNewRoomTitle={setNewRoomTitle}
          handleUpdateRoomTitle={handleUpdateRoomTitle}
          handleDeleteRoom={handleDeleteRoom}
        />
      )}
      
    </div>
  );
};

export default LiveRoom;