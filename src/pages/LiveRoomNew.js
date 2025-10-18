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
import ChatComponent from "../components/liveRoom/roomScreen/ChatComponent";
import RoomMenuModal from "../components/liveRoom/RoomMenuModal";

// functions
import {
  joinAsSpeaker, // add user as speaker (se for usar)
  leaveStage,    // remove speaker (se for usar)
  onSaveSettings,
  handleDeleteRoom,
} from "./functions/liveRoomFunctions2";
import { handleBack } from "../components/functions/headerFunctions";

import { useNavigate } from "react-router-dom";

const LiveRoomNew = () => {
  const baseUrl = process.env.REACT_APP_API_BASE_URL || "";

  const { currentUser } = useUser();
  const {
    minimizeRoom,
    handleLeaveRoom,
    isCurrentUserSpeaker,
    room,
    setRoomId,
    canStartRoom,
  } = useRoom();

  const { joinChannel, leaveChannel } = useAudio();
  const { socket } = useSocket();
  const { roomId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const [sala, setSala] = useState(location.state?.sala || null);
  const [roomTheme, setRoomTheme] = useState(
    sala?.roomTitle ? `Bem vindo a sala ${sala.roomTitle}` : "Carregando sala…"
  );
  const isRejoiningRef = useRef(false);
  const [microphoneOn, setMicrophoneOn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newCoverFile, setNewCoverFile] = useState(null);

  // ✅ speakers agora vêm de room.speakers
  const hasSpeakers = Array.isArray(room?.speakers) && room.speakers.length > 0;
  const showSpeakers = hasSpeakers || isCurrentUserSpeaker;

  // ✅ setRoomId apenas quando roomId mudar
  useEffect(() => {
    if (roomId) setRoomId(roomId);
  }, [roomId, setRoomId]);

  // ✅ auto-join (Agora + socket) ao montar / mudar sala
  useEffect(() => {
    if (!roomId || !currentUser?._id) return;
    // agora channel (idempotente)
    joinChannel({ roomId, userId: currentUser._id });
  }, [roomId, currentUser?._id, joinChannel, socket]);

  // ✅ re-join no foco/visibilidade (cobre refresh rápido)
  useEffect(() => {
    const rejoin = () => {
      if (!roomId || !currentUser?._id) return;
      joinChannel({ roomId, userId: currentUser._id });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") rejoin();
    };
    window.addEventListener("focus", rejoin);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", rejoin);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [roomId, currentUser?._id, joinChannel, socket]);

  console.log("room:", room)
  console.log("room.isLive:", room?.isLive)

  const isLive = !!room?.isLive;

  return (
    <div className="screenWrapper liveRoom">
      <div className={isLive ? "topLiveOn" : "topLiveOff"}>
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
        }
        roomId={roomId}
      />

      {isLive && showSpeakers && <Speakers />}
      <Listeners />
      <VoiceComponent roomId={roomId} />
      </div>

      <div className={isLive ? "bottomLiveOn" : "bottomLiveOff"}>
      <ChatComponent roomId={roomId} />
      </div>
      {showSettingsModal && (
        <RoomMenuModal
          setShowSettingsModal={(v) => !isLoading && setShowSettingsModal(v)}
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
          currentCoverUrl={sala?.coverUrl || ""}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default LiveRoomNew;
