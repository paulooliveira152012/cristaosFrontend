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
  // 🔊 Assina e toca assim que alguém publicar
useClientEvent(client, "user-published", async (user, mediaType) => {
  console.log("[Agora] user-published:", user.uid, mediaType);
  if (mediaType === "audio") {
    try {
      await client.subscribe(user, "audio");
      console.log("[Agora] subscribed to audio of", user.uid);
      user.audioTrack?.play();
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


  // ✅ NOVO: assina quem já estava publicado quando eu entrei
useEffect(() => {
  (async () => {
    try {
      for (const u of remoteUsers) {
        if (u.hasAudio) {
          console.log("[Agora] subscribing late-join to", u.uid);
          await client.subscribe(u, "audio");
          u.audioTrack?.play();
          console.log("[Agora] playing remote audio (late-join)", u.uid);
        }
      }
    } catch (e) {
      console.warn("[Agora] late subscribe error:", e);
    }
  })();
}, [remoteUsers, client]);

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

  // dentro do AudioInner (depois de declarar remoteUsers)
  useEffect(() => {
    (async () => {
      try {
        for (const u of remoteUsers) {
          // hasAudio é definido pelo agora-rtc-react quando o user publicou audio
          if (u.hasAudio) {
            console.log("[Agora] subscribing late-join to", u.uid);
            await client.subscribe(u, "audio");
            u.audioTrack?.play();
            console.log("[Agora] playing remote audio (late-join)", u.uid);
          }
        }
      } catch (e) {
        console.warn("[Agora] late subscribe error:", e);
      }
    })();
  }, [remoteUsers, client]);

  useEffect(() => {
    const log = () => {
      console.log(
        "[Agora] state:",
        client.connectionState,
        "my uid:",
        client.uid,
        "desiredRole:",
        desiredRole,
        "micOn:",
        micOn
      );
    };
    const id = setInterval(log, 1500);
    return () => clearInterval(id);
  }, [client, desiredRole, micOn]);

  // ========= HELPERS ================
  // no topo do AudioInner (perto dos outros hooks/consts)
  const waitForJoin = useCallback(
    async (maxMs = 1500) => {
      // aguarda a sessão estar realmente conectada antes de setar role/publish
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        // Heurística simples: se já tem channel e o client tem connectionState "CONNECTED"
        const state = client.connectionState; // string: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | ...
        if (state === "CONNECTED") return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    },
    [client]
  );

  // ========= AÇÕES EXPOSTAS =========

  const joinChannel = useCallback(
  async ({ roomId, userId }) => {
    if (!roomId || !userId) return { ok: false, reason: "missing_params" };
    console.log("[Agora] joining channel", roomId, "with uid", userId);
    setUid(userId);
    setDesiredRole("audience");
    setChannel(roomId);
    socket?.emit?.("joinRoomChat", { roomId, currentUserId: userId }, () => {});
    return { ok: true };
  },
  [socket]
);


  const joinAsSpeaker = useCallback(
    async ({ roomId }) => {
      if (!roomId) return { ok: false, reason: "missing_roomId" };

      // garante que entrou no canal (se ainda não entrou)
      if (!channel) setChannel(roomId);

      // espera o join concluir
      const ok = await waitForJoin(2000);
      if (!ok) {
        console.warn(
          "[Agora] join não ficou conectado a tempo para setar host"
        );
        // De qualquer forma, peça ao efeito aplicar quando conectar:
        setDesiredRole("host");
      } else {
        // aplica papel agora (mais confiável que esperar o effect)
        try {
          await client.setClientRole("host");
          currentRoleRef.current = "host";
          console.log("[Agora] role set to host (joinAsSpeaker)");
        } catch (e) {
          console.warn("[Agora] setClientRole(host) error:", e);
          // fallback: deixa o effect aplicar depois
          setDesiredRole("host");
        }
      }

      // mic começa OFF por padrão; só marca no servidor que subiu ao palco
      setMicOn(false);
      socket?.emit?.("joinAsSpeaker", { roomId });

      return { ok: true };
    },
    [socket, channel, client, waitForJoin]
  );

  const toggleMicrophone = useCallback(
    async ({ roomId, on }) => {
      // se for ligar o mic e ainda não for host, promova antes
      if (on && currentRoleRef.current !== "host") {
        const ok = await waitForJoin(2000);
        if (ok) {
          try {
            await client.setClientRole("host");
            currentRoleRef.current = "host";
            console.log("[Agora] role escalado para host no toggleMicrophone");
          } catch (e) {
            console.warn("[Agora] setClientRole(host) no toggle error:", e);
            // fallback: deixa o effect aplicar assim que possível
            setDesiredRole("host");
          }
        } else {
          // ainda assim tenta marcar intenção
          setDesiredRole("host");
        }
      }

      setMicOn(!!on);
      if (roomId) socket?.emit?.("toggleMicrophone", { roomId, on: !!on });
    },
    [socket, client, waitForJoin]
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
    [
      joinChannel,
      joinAsSpeaker,
      toggleMicrophone,
      leaveChannel,
      remoteUsers,
      micOn,
      client,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
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
