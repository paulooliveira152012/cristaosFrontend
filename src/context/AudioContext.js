import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import io from "socket.io-client";

// 0=NONE, 1=ERROR, 2=WARN, 3=INFO, 4=DEBUG
AgoraRTC.setLogLevel(1);
AgoraRTC.enableLogUpload?.(false);

const AudioContext = createContext(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio deve ser usado dentro de <AudioProvider>");
  return ctx;
};

// ── Socket seguro (usa mesma origem se não houver BASE_URL) ──
const API_URL = process.env.REACT_APP_API_BASE_URL || undefined;
const socket = io(API_URL, { withCredentials: true });

export const AudioProvider = ({ children }) => {
  const [agoraClient, setAgoraClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  const [micState, setMicState] = useState(false);

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  const TOKEN = process.env.REACT_APP_AGORA_TOKEN || null;

  // ── Inicializa client e listeners uma única vez ──
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setAgoraClient(client);

    const onUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          user.audioTrack?.play();
          setRemoteUsers((prev) => {
            // evita duplicados
            const exists = prev.some((u) => u.uid === user.uid);
            return exists ? prev : [...prev, user];
          });
        }
      } catch (err) {
        console.warn("Erro ao subscrever usuário:", err);
      }
    };

    const onUserUnpublished = (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };

    client.on("user-published", onUserPublished);
    client.on("user-unpublished", onUserUnpublished);

    return () => {
      client.removeAllListeners();
      // encerra e limpa possíveis tracks
      (async () => {
        try {
          const local = client.localTracks || [];
          for (const t of local) {
            try { t.stop(); } catch {}
            try { t.close(); } catch {}
          }
          await client.leave();
        } catch {}
      })();
    };
  }, []);

  // ── Entra no canal (ouvindo). Não publica microfone aqui ──
  const joinChannel = useCallback(
    async (channel, userId) => {
      if (!agoraClient) return { ok: false, reason: "no_client" };
      if (!APP_ID) return { ok: false, reason: "missing_app_id" };
      if (!channel) return { ok: false, reason: "missing_channel" };
      if (!userId) return { ok: false, reason: "missing_user" };

      // evita re-join
      if (agoraClient.connectionState && agoraClient.connectionState !== "DISCONNECTED") {
        return { ok: true, reason: "already_connected" };
      }

      await agoraClient.join(APP_ID, channel, TOKEN, userId);
      setIsInCall(true);
      setMicState(false);
      return { ok: true };
    },
    [agoraClient, APP_ID, TOKEN]
  );

  // ── Sobe como palestrante (stage) e informa via socket.io ──
  const joinAsSpeaker = useCallback(
    async (channel, userId, roomId) => {
      if (!agoraClient) return;
      if (!APP_ID || !channel || !userId) return;

      if (agoraClient.connectionState === "DISCONNECTED") {
        await agoraClient.join(APP_ID, channel, TOKEN, userId);
        setIsInCall(true);
        setMicState(false);
      }
      socket.emit("joinAsSpeaker", { userId, roomId });
    },
    [agoraClient, APP_ID, TOKEN]
  );

  // ── Sair do canal e limpar tudo ──
  const leaveChannel = useCallback(async () => {
    if (!agoraClient || !isInCall) return;
    try {
      if (localAudioTrack) {
        try { localAudioTrack.stop(); } catch {}
        try { localAudioTrack.close(); } catch {}
        setLocalAudioTrack(null);
      }
      const local = agoraClient.localTracks || [];
      for (const t of local) {
        try { t.stop(); } catch {}
        try { t.close(); } catch {}
      }
      await agoraClient.leave();
    } finally {
      setIsInCall(false);
      setMicState(false);
      setRemoteUsers([]);
    }
  }, [agoraClient, isInCall, localAudioTrack]);

  // ── Liga/Desliga microfone; cria track só quando liga pela 1ª vez ──
  const toggleMicrophone = useCallback(
    async (micOn, userId, roomId) => {
      if (!agoraClient || agoraClient.connectionState !== "CONNECTED") return;

      if (micOn) {
        if (!localAudioTrack) {
          const track = await AgoraRTC.createMicrophoneAudioTrack();
          setLocalAudioTrack(track);
          await agoraClient.publish([track]);
        } else {
          await localAudioTrack.setEnabled(true);
        }
      } else if (localAudioTrack) {
        await localAudioTrack.setEnabled(false);
      }

      setMicState(micOn);
      if (userId && roomId) {
        socket.emit("micStatusChanged", { userId, micOpen: micOn, roomId });
      }
    },
    [agoraClient, localAudioTrack]
  );

  const value = useMemo(
    () => ({
      joinChannel,       // para o startLiveCore chamar (entra como ouvinte)
      joinAsSpeaker,     // botão "Subir ao palco"
      leaveChannel,
      toggleMicrophone,
      remoteUsers,
      isInCall,
      micState,
      setMicState,
      agoraClient,
    }),
    [joinChannel, joinAsSpeaker, leaveChannel, toggleMicrophone, remoteUsers, isInCall, micState, agoraClient]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
