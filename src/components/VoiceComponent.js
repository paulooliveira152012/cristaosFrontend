import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AudioContext from "../context/AudioContext";
import { useRoom } from "../context/RoomContext";
import io from "socket.io-client";
import Profile from "../pages/profile";

const VoiceComponent = ({
  isMinimized,
  socket,
  // currentUsersSpeaking,
  setCurrentUsersSpeaking,
}) => {
  const { roomId } = useParams();
  const { currentUser } = useUser();
  const { minimizedRoom } = useRoom();
  const {
    joinChannel,
    leaveChannel,
    toggleMicrophone,
    remoteUsers,
    isInCall,
    agoraClient,
    micState,
  } = useContext(AudioContext);

  const [localError, setLocalError] = useState("");
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Join voice channel on mount
  useEffect(() => {
    if (!currentUser || !roomId || isInCall) return;

    const joinVoiceChannel = async () => {
      try {
        console.log("✅ Joining voice channel for room:", roomId);
        await joinChannel(roomId, currentUser._id);
        setLocalError("");
      } catch (err) {
        console.error("Error joining Agora channel:", err);
        setLocalError("Error joining voice chat. Please try again.");
      }
    };

    if (!isMinimized && !isInCall) {
      joinVoiceChannel();
    }
  }, [isMinimized, roomId, currentUser, isInCall, joinChannel]);

  // Toggle mic only if user is speaker
  useEffect(() => {
    const toggleMic = async () => {
      if (
        !isSpeaker ||
        !agoraClient ||
        agoraClient.connectionState !== "CONNECTED"
      )
        return;

      try {
        await toggleMicrophone(micState, currentUser._id, roomId);
      } catch (err) {
        console.error("Error toggling microphone:", err);
        setLocalError("Error with microphone. Please try again.");
      }
    };

    toggleMic();
  }, [micState, agoraClient, toggleMicrophone, isSpeaker]);

  const joiningChat = () => {
    console.log("🔥 Subindo ao palco via socket:", socket?.id);

    const newSpeaker = {
      _id: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage,
      micOpen: micState, // ou false, dependendo da lógica
    };

    socket.emit("joinAsSpeaker", {
      roomId,
      user: newSpeaker,
    });

    // Atualiza visualmente no front-end imediatamente
    // Feedback imediato: adiciona localmente enquanto espera confirmação do backend
setCurrentUsersSpeaking((prev) => {
  const alreadyExists = prev.some((u) => u._id === currentUser._id);
  return alreadyExists
    ? prev
    : [
        ...prev,
        {
          _id: currentUser._id,
          username: currentUser.username,
          profileImage: currentUser.profileImage,
          isSpeaker: true,
          micOpen: false,
        },
      ];
});

    setIsSpeaker(true);
    // this function needs to make it so that the participant is displayed in the currentUsersSpeaking in the liveRoom
    // console.log("currentUsersSpeaking:", currentUsersSpeaking);
  };

  return (
    <div id="container">
      {localError && <div>{localError}</div>}

      {!isSpeaker ? (
        <button
          onClick={() => {
            joiningChat();
          }}
        >
          Subir ao palco
        </button>
      ) : (
        <button
          onClick={() => toggleMicrophone(!micState, currentUser._id, roomId)}
        >
          {micState ? "Desligar microfone" : "Ligar microfone"}
        </button>
      )}
    </div>
  );
};

export default VoiceComponent;
