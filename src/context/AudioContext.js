import { createContext, useContext, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import io from "socket.io-client";

// 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
AgoraRTC.setLogLevel(1);          // ✅ só erros do Agora no console
AgoraRTC.enableLogUpload?.(false); // evita enviar logs pra Agora

const AudioContext = createContext(null); // mantém o objeto do contexto

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx)
    throw new Error("useAudio deve ser usado dentro de <AudioProvider>");
  return ctx;
};

const socket = io(process.env.REACT_APP_API_BASE_URL);

export const AudioProvider = ({ children }) => {
  const [agoraClient, setAgoraClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [micState, setMicState] = useState(false);

  const APP_ID = "22d2fe11bf654e1a8f4c3c7d8d6d4c98";
  const TOKEN = null;

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setAgoraClient(client);

    client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        await client.subscribe(user, mediaType);
        user.audioTrack?.play();
        setRemoteUsers((prev) => [...prev, user]);
      }
    });

    client.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    return () => {
      client.removeAllListeners();
      client.leave().catch(() => {});
    };
  }, []);

  const joinChannel = async (channel, userId) => {
    if (
      !agoraClient ||
      isInCall ||
      agoraClient.connectionState !== "DISCONNECTED"
    )
      return;
    await agoraClient.join(APP_ID, channel, TOKEN, userId);
    setIsInCall(true);
  };

  const joinAsSpeaker = async (channel, userId, roomId) => {
    if (
      !agoraClient ||
      isInCall ||
      agoraClient.connectionState !== "DISCONNECTED"
    )
      return;
    await agoraClient.join(APP_ID, channel, TOKEN, userId);
    setIsInCall(true);
    setMicState(false);
    socket.emit("joinAsSpeaker", { userId, roomId });
  };

  const leaveChannel = async () => {
    if (!agoraClient || !isInCall) return;
    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      await agoraClient.leave();
    } finally {
      setIsInCall(false);
      setRemoteUsers([]);
    }
  };

  const toggleMicrophone = async (micOn, userId, roomId) => {
    if (!agoraClient || agoraClient.connectionState !== "CONNECTED") return;

    if (micOn && !localAudioTrack) {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await agoraClient.publish([audioTrack]);
    } else if (micOn && localAudioTrack) {
      await localAudioTrack.setEnabled(true);
    } else if (!micOn && localAudioTrack) {
      await localAudioTrack.setEnabled(false);
    }

    setMicState(micOn);
    if (userId && roomId) {
      socket.emit("micStatusChanged", { userId, micOpen: micOn, roomId });
    }
  };

  const value = {
    joinChannel,
    joinAsSpeaker,
    leaveChannel,
    toggleMicrophone,
    remoteUsers,
    isInCall,
    micState,
    setMicState,
    agoraClient,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
};
