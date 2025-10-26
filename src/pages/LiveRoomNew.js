// LiveRoomNew.js
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "../styles/liveRoom.css";

// contexts
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
import { onSaveSettings, handleDeleteRoom } from "./functions/liveRoomFunctions2";
import { handleBack } from "../components/functions/headerFunctions";

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

  const { socket } = useSocket();
  const audio = useAudio();
  const joinedRef = useRef({ roomId: null, as: null }); // memo do último join (audience/publisher)

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

  // speakers agora vêm de room.speakers
  const hasSpeakers = Array.isArray(room?.speakers) && room.speakers.length > 0;
  const showSpeakers = hasSpeakers || isCurrentUserSpeaker;

  // helper: busca token no seu backend
  async function fetchRtcToken(role) {
    const res = await fetch(
      `${baseUrl}/api/rooms/${roomId}/rtc-token?role=${role}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error(`rtc-token http ${res.status}`);
    const data = await res.json();
    const rtc = data?.rtc;
    if (!rtc?.channel || !rtc?.token) throw new Error("rtc inválido");
    return rtc; // { channel, token, uid? }
  }

  // define o roomId no RoomContext quando rota mudar
  useEffect(() => {
    if (roomId) setRoomId(roomId);
  }, [roomId, setRoomId]);

  // auto-join como AUDIENCE quando a sala estiver live
  useEffect(() => {
    if (!roomId || !currentUser?._id) return;

    const joinAudience = async () => {
      if (!room?.isLive) {
        // se a live desligou e estamos conectados, sair do canal
        if (audio?.state === "CONNECTED") {
          try {
            await audio.leave?.();
          } catch {}
        }
        joinedRef.current = { roomId: null, as: null };
        return;
      }

      // evita join duplicado
      if (
        joinedRef.current.roomId === roomId &&
        joinedRef.current.as === "audience" &&
        audio?.state === "CONNECTED"
      ) {
        return;
      }

      try {
        const rtc = await fetchRtcToken("audience");
        const ok = await audio.ensureJoined(rtc.channel, rtc.uid, rtc.token);
        if (ok) {
          joinedRef.current = { roomId, as: "audience" };
          // audiência NÃO publica mic
        }
      } catch (err) {
        console.error("[LiveRoomNew] join audience falhou:", err);
      }
    };

    joinAudience();
  }, [roomId, room?.isLive, currentUser?._id, audio, baseUrl]);

  // listener opcional — se o back emitir "room:live", seu RoomContext já deve atualizar room.isLive
  useEffect(() => {
    if (!socket || !roomId) return;
    const onRoomLive = (payload) => {
      if (String(payload?.roomId) !== String(roomId)) return;
      // nada aqui: o effect acima dispara via room?.isLive atualizado pelo RoomContext
    };
    socket.on("room:live", onRoomLive);
    return () => socket.off("room:live", onRoomLive);
  }, [socket, roomId]);

  // handler para "Subir para falar" — precisa token de publisher
  const handleBecomeSpeaker = async () => {
    try {
      const rtc = await fetchRtcToken("publisher");
      // mesmo já CONNECTED como audience, ensureJoined é idempotente para o mesmo canal
      const ok = await audio.ensureJoined(rtc.channel, rtc.uid, rtc.token);
      if (ok) {
        await audio.startMic(); // seu AudioContext já chama setClientRole('host')
        joinedRef.current = { roomId, as: "publisher" };
      }
    } catch (e) {
      console.error("[LiveRoomNew] subir para falar falhou:", e);
    }
  };

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
              leaveChannel: audio.leave,
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

        {isLive && !isCurrentUserSpeaker && (
          <button className="joinSpeakers" onClick={handleBecomeSpeaker}>
            Subir para falar
          </button>
        )}

        <VoiceComponent roomId={roomId} />

        {/* Debug opcional
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={async () => {
            try {
              const rtc = await fetchRtcToken("publisher");
              await audio.ensureJoined(rtc.channel, rtc.uid, rtc.token);
              await audio.startMic();
            } catch(e) { console.error(e); }
          }}>Ligar mic (publisher)</button>
          <button onClick={audio.stopMic}>Desligar mic</button>
          <button onClick={audio.leave}>Sair do canal</button>
        </div> */}

        <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Agora: <b>{audio.state}</b> | myUid: <b>{String(audio.myUid || "")}</b>
        </p>
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
