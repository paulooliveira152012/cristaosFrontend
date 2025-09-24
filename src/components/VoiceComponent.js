import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useAudio } from "../context/AudioContext";
import { useRoom } from "../context/RoomContext";

const VoiceComponent = ({ isMinimized }) => {
  const { roomId } = useParams();
  const { currentUser } = useUser();
  // =============== contexto da sala
  const { emitJoinAsSpeaker, isCurrentUserSpeaker, isRoomLive } = useRoom();

  const { joinChannel, leaveChannel, toggleMicrophone, isInCall, agoraClient, micState } =
    useAudio();

  const [localError, setLocalError] = useState("");
  const [isSpeaker, setIsSpeaker] = useState(false);

  console.log("isRoomLive no VoiceComponent:", isRoomLive)

  // 1) Entrar no canal assim que a live ligar
  useEffect(() => {
    if (!currentUser || !roomId) return;
    if (isMinimized) return;
    if (isInCall) return;
    if (!isRoomLive) return; // só entra quando a live está ON

    const joinVoiceChannel = async () => {
      try {
        await joinChannel(roomId, currentUser._id);
        setLocalError("");
      } catch (err) {
        console.error("Error joining Agora channel:", err);
        setLocalError("Erro ao entrar no chat de voz.");
      }
    };
    joinVoiceChannel();
  }, [isMinimized, roomId, currentUser?._id, isInCall, isRoomLive, joinChannel]);
  // 2) Assina novos speakers que publicarem depois que você já está no canal
  useEffect(() => {
    if (!agoraClient) return;
    const onUserPublished = async (user, mediaType) => {
      try {
        if (mediaType === "audio") {
          await agoraClient.subscribe(user, mediaType);
          user.audioTrack && user.audioTrack.play();
        }
      } catch (e) {
        console.warn("subscribe/play failed:", e);
      }
    };

    const onUserUnpublished = async (user, mediaType) => {
      try {
        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.stop();
        }
      } catch (e) {
        console.warn("unpublish stop failed:", e);
      }
    };

    agoraClient.on("user-published", onUserPublished);
    agoraClient.on("user-unpublished", onUserUnpublished);
    return () => {
      agoraClient.off("user-published", onUserPublished);
      agoraClient.off("user-unpublished", onUserUnpublished);
    };
  }, [agoraClient]);
  // 3) Quando a live liga, toca qualquer áudio remoto já presente
  // 3) Quando a live liga, (re)assina e toca os remotos já presentes
  useEffect(() => {
    if (!isRoomLive || !agoraClient || !isInCall) return;
    (async () => {
      try {
        const users = [...(agoraClient.remoteUsers || [])];
        for (const u of users) {
          try {
            // subscribe é idempotente; garante que o audioTrack exista
            await agoraClient.subscribe(u, "audio");
            if (u.audioTrack) u.audioTrack.play();
          } catch (e) {
            console.warn("subscribe/play (existing) failed:", e);
          }
        }
      } catch (e) {
        console.warn("force subscribe/play failed:", e);
      }
    })();
  }, [isRoomLive, agoraClient, isInCall]);

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
  }, [micState, isSpeaker, toggleMicrophone, currentUser?._id, roomId, agoraClient]);

   // Sair do canal quando live desliga ou a view é minimizada
 useEffect(() => {
   if (!isInCall) return;
   if (isRoomLive && !isMinimized) return; // continua
   (async () => {
     try { await leaveChannel?.(); } catch {}
   })();
 }, [isRoomLive, isMinimized, isInCall, leaveChannel]);


  const handleJoinAsSpeaker = () => {
    // console.log("1️⃣")
    // console.log("1 -> funcao chamada para subir ao palco")
    // console.log("roomId:", roomId)
    // console.log("currentUser:", currentUser)
    // console.log("micState", micState)

    // chamar funcao que acessa rota para adicionar ao banco de dados
    // addSpeakerToRoom(roomId, currentUser, baseUrl)
    // chamar funcao que emit socket no useRoom (RoomContext.js)
    emitJoinAsSpeaker(roomId, currentUser, micState);
    setIsSpeaker(true);
  };

  // console.log("isCurrentUserSpeaker no VoiceComponent:", isCurrentUserSpeaker )
  // console.log("✅ isRoomLive:", isRoomLive)

  return (
    <div id="container">
      {localError && <div>{localError}</div>}

      {
        !isCurrentUserSpeaker && isRoomLive && (
          <button onClick={handleJoinAsSpeaker}>Subir ao palco1</button>
        )
        // : (
        //   <button
        //     onClick={() =>
        //       toggleMicrophone(!micState, currentUser._id, roomId)
        //     }
        //   >
        //     {micState ? "Desligar microfone" : "Ligar microfone"}
        //   </button>
        // )
      }
    </div>
  );
};

export default VoiceComponent;
