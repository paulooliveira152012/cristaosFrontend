// src/context/AudioContext.js
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useSocket } from "./SocketContext";

const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

// ----- Inner provider que usa os hooks do agora-rtc-react -----
function AudioInner({ client, children }) {
  const { socket } = useSocket();

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  const TOKEN  = process.env.REACT_APP_AGORA_TOKEN || null;

  const [channel, setChannel] = useState(null);
  const [uid, setUid]         = useState(null);
  const [micOn, setMicOn]     = useState(false);

  // entra/sai baseado em channel != null
  useJoin({ appid: APP_ID, channel, token: TOKEN, uid }, Boolean(channel));

  // cria track quando micOn=true e publica
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  usePublish(micOn ? [localMicrophoneTrack] : []);

  const remoteUsers = useRemoteUsers();

  const joinChannel = useCallback(
    ({ roomId, userId }) => {
      if (!roomId || !userId) return { ok: false, reason: "missing_params" };
      setUid(userId);
      setChannel(roomId);
      // emite join (idempotente; backend lê userId do JWT também)
      socket?.emit?.("joinRoomChat", { roomId, currentUserId: userId }, () => {});
      return { ok: true };
    },
    [socket]
  );

  const joinAsSpeaker = useCallback(
  ({ roomId }) => {
    if (!roomId) return { ok: false, reason: "missing_roomId" };
    // 🔇 mantém o mic desligado; só marca o papel de speaker no back
    setMicOn(false);
    socket?.emit?.("joinAsSpeaker", { roomId });
    return { ok: true };
  },
  [socket]
);


  const toggleMicrophone = useCallback(
  ({ roomId, on }) => {
    setMicOn(!!on);
    if (roomId) socket?.emit?.("toggleMicrophone", { roomId, on: !!on });
  },
  [socket]
);


  const leaveChannel = useCallback(
    ({ roomId }) => {
      setMicOn(false);
      setChannel(null); // useJoin fará o leave
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
      client, // expõe se precisar
    }),
    [joinChannel, joinAsSpeaker, toggleMicrophone, leaveChannel, remoteUsers, micOn, client]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

// ----- Provider externo que cria o client e injeta no AgoraRTCProvider -----
export default function AudioProvider({ children }) {
  const client = useMemo(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }), []);
  return (
    <AgoraRTCProvider client={client}>
      <AudioInner client={client}>{children}</AudioInner>
    </AgoraRTCProvider>
  );
}
