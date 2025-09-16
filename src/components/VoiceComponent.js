import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAudio } from "../context/AudioContext";
import { useRoom } from "../context/RoomContext";
import { addSpeakerToRoom } from "../pages/functions/liveRoomFunctions";
import { removeSpeakerFromRoom } from "../pages/functions/liveRoomFunctions";

const VoiceComponent = ({ isMinimized }) => {
  const { roomId } = useParams();
  const { currentUser } = useUser();
  const { emitJoinAsSpeaker } = useRoom();
  
  const {
    joinChannel,
    toggleMicrophone,
    isInCall,
    agoraClient,
    micState,
  } = useAudio();

  const [localError, setLocalError] = useState("");
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    if (!currentUser || !roomId || isInCall) return;

    const joinVoiceChannel = async () => {
      try {
        await joinChannel(roomId, currentUser._id);
        setLocalError("");
      } catch (err) {
        console.error("Error joining Agora channel:", err);
        setLocalError("Erro ao entrar no chat de voz.");
      }
    };

    if (!isMinimized && !isInCall) {
      joinVoiceChannel();
    }
  }, [isMinimized, roomId, currentUser, isInCall, joinChannel]);

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
        setLocalError("Erro ao alternar microfone.");
      }
    };

    toggleMic();
  }, [micState, isSpeaker]);

  const handleJoinAsSpeaker = () => {
    console.log("1️⃣")
    console.log("1 -> funcao chamada para subir ao palco")
    console.log("roomId:", roomId)
    console.log("currentUser:", currentUser)
    console.log("micState", micState)

  // chamar funcao que acessa rota para adicionar ao banco de dados
    // addSpeakerToRoom(roomId, currentUser, baseUrl)
    // chamar funcao que emit socket no useRoom (RoomContext.js)
    emitJoinAsSpeaker(roomId, currentUser, micState);
    setIsSpeaker(true);
  };

  return (
    <div id="container">
      {localError && <div>{localError}</div>}

      {!isSpeaker ? (
        <button onClick={handleJoinAsSpeaker}>Subir ao palco</button>
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
