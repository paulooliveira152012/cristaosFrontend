// src/context/AudioContext.js
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useClientEvent,
} from "agora-rtc-react";
import { useSocket } from "./SocketContext";

const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

// ----- Inner provider que usa os hooks do agora-rtc-react -----
function AudioInner({ client, children }) {
  const { socket } = useSocket();

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  const TOKEN = process.env.REACT_APP_AGORA_TOKEN || null;

  const [channel, setChannel] = useState(null);
  const [uid, setUid] = useState(null);
  const [micOn, setMicOn] = useState(false);

  // 👇 papel desejado: "audience" por padrão
  const [desiredRole, setDesiredRole] = useState("audience");
  const currentRoleRef = useRef(null); // evita setar papel repetidamente

  // entra/sai baseado em channel != null
  useJoin({ appid: APP_ID, channel, token: TOKEN, uid }, Boolean(channel));

  // cria track quando micOn=true e publica
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  usePublish(micOn && localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const remoteUsers = useRemoteUsers();

  // logs úteis de estado de conexão
  useClientEvent(client, "connection-state-change", (cur, prev, reason) => {
    console.log("[Agora] connection:", prev, "→", cur, "reason:", reason);
  });

  // 🔊 Assina e toca o áudio remoto assim que alguém publica
  useClientEvent(client, "user-published", async (user, mediaType) => {
    console.log("[Agora] user-published:", user.uid, mediaType);
    if (mediaType === "audio") {
      try {
        await client.subscribe(user, "audio");
        console.log("[Agora] subscribed to audio of", user.uid);
        user.audioTrack?.play(); // cria <audio> e toca
        console.log("[Agora] playing remote audio of", user.uid);
      } catch (err) {
        console.warn("[Agora] subscribe error:", err);
      }
    }
  });

  // (opcional) parar quando alguém despublica
  useClientEvent(client, "user-unpublished", (user, mediaType) => {
    if (mediaType === "audio") {
      try {
        user.audioTrack?.stop();
      } catch {}
    }
  });

  // ✅ aplica o papel sempre que entrar/alterar papel
  useEffect(() => {
    const applyRole = async () => {
      if (!channel) return;
      if (currentRoleRef.current === desiredRole) return;

      try {
        await client.setClientRole(desiredRole);
        currentRoleRef.current = desiredRole;
        console.log("[Agora] role set to:", desiredRole);
      } catch (e) {
        console.warn("[Agora] setClientRole error:", e);
      }
    };
    applyRole();
  }, [client, channel, desiredRole]);

  // ========= AÇÕES EXPOSTAS =========

  const joinChannel = useCallback(
    async ({ roomId, userId }) => {
      if (!roomId || !userId) return { ok: false, reason: "missing_params" };
      setUid(userId);
      setDesiredRole("audience"); // entra como ouvinte
      setChannel(roomId);
      socket?.emit?.("joinRoomChat", { roomId, currentUserId: userId }, () => {});
      return { ok: true };
    },
    [socket]
  );

  const joinAsSpeaker = useCallback(
    async ({ roomId }) => {
      if (!roomId) return { ok: false, reason: "missing_roomId" };
      if (!channel) setChannel(roomId);
      setDesiredRole("host"); // sobe para host (mic continua OFF)
      setMicOn(false);
      socket?.emit?.("joinAsSpeaker", { roomId });
      return { ok: true };
    },
    [socket, channel]
  );

  const toggleMicrophone = useCallback(
    async ({ roomId, on }) => {
      setMicOn(!!on);
      if (roomId) socket?.emit?.("toggleMicrophone", { roomId, on: !!on });
    },
    [socket]
  );

  const leaveChannel = useCallback(
    async ({ roomId }) => {
      setMicOn(false);
      setDesiredRole("audience"); // próxima entrada volta como audience
      setChannel(null);
      currentRoleRef.current = null;
      if (roomId) socket?.emit?.("leaveRoomChat", { roomId }, () => {});
    },
    [socket]
  );

  const value = useMemo(
    () => ({
      joinChannel,
      joinAsSpeaker,
      toggleMicrophone,
      leaveChannel,
      remoteUsers,
      micOn,
      client,
    }),
    [joinChannel, joinAsSpeaker, toggleMicrophone, leaveChannel, remoteUsers, micOn, client]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

// ----- Provider externo que cria o client e injeta no AgoraRTCProvider -----
export default function AudioProvider({ children }) {
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "live", codec: "vp8" }),
    []
  );
  return (
    <AgoraRTCProvider client={client}>
      <AudioInner client={client}>{children}</AudioInner>
    </AgoraRTCProvider>
  );
}
