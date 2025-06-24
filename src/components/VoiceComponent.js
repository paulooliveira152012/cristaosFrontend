import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AudioContext from "../context/AudioContext";
import { useRoom } from "../context/RoomContext";
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_BASE_URL);

const VoiceComponent = ({ isMinimized }) => {
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
      if (!isSpeaker || !agoraClient || agoraClient.connectionState !== "CONNECTED") return;

      try {
        await toggleMicrophone(micState, currentUser._id, roomId);
      } catch (err) {
        console.error("Error toggling microphone:", err);
        setLocalError("Error with microphone. Please try again.");
      }
    };

    toggleMic();
  }, [micState, agoraClient, toggleMicrophone, isSpeaker]);

  return (
    <div id="container">
      {localError && <div>{localError}</div>}

      {!isSpeaker ? (
        <button
          onClick={() => {
            socket.emit("joinAsSpeaker", {
              roomId,
              userId: currentUser._id,
            });
            setIsSpeaker(true);
          }}
        >
          Subir ao palco
        </button>
      ) : (
        <button
          onClick={() =>
            toggleMicrophone(!micState, currentUser._id, roomId)
          }
        >
          {micState ? "Desligar microfone" : "Ligar microfone"}
        </button>
      )}
    </div>
  );
};

export default VoiceComponent;
