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

function AudioInner({ client, children }) {
  const { socket } = useSocket();

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  const TOKEN = process.env.REACT_APP_AGORA_TOKEN || null;

  const [channel, setChannel] = useState(null);
  const [uid, setUid] = useState(null);
  const [micOn, setMicOn] = useState(false);

  const [desiredRole, setDesiredRole] = useState("audience");
  const currentRoleRef = useRef(null);

  // join/leave controlado por channel != null
  // useJoin({ appid: APP_ID, channel, token: TOKEN, uid }, Boolean(channel));
  useEffect(() => {
    console.log("✅ 1")
  let cancelled = false;

  const doJoin = async () => {
    if (!channel) return;
    if (!APP_ID) { console.error("🚨 APP_ID ausente"); return; }

    console.log("🟢 Agora join params:", {
      appIdLen: (APP_ID || "").length,
      channel,
      uidProvided: !!uid,
      tokenProvided: !!TOKEN,
    });

    try {
      // limpa sessão anterior
      if (client.connectionState !== "DISCONNECTED") {
        try { await client.leave(); } catch {}
      }

      // ⚠️ NÃO bloqueie por uid; deixe null se ainda não setou
      const joinedUid = await client.join(APP_ID, channel, TOKEN ?? null, uid ?? null);
      if (cancelled) return;

      // se não tínhamos uid, salve o alocado pelo Agora
      if (!uid && joinedUid != null) {
        setUid(String(joinedUid));
      }

      console.log("✅ JOIN OK • joinedUid:", joinedUid, "• state:", client.connectionState);
    } catch (e) {
      if (cancelled) return;
      console.error("❌ JOIN FAILED:", e?.code || e?.name, e?.message, e);
    }
  };

  doJoin();
  return () => { cancelled = true; };
}, [APP_ID, TOKEN, channel, uid, client]);


  // cria track quando micOn=true e publica
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  usePublish(micOn && localMicrophoneTrack ? [localMicrophoneTrack] : []);

  const remoteUsers = useRemoteUsers();

  // LOGS de conexão
  useClientEvent(client, "connection-state-change", (cur, prev, reason) => {
    console.log("[Agora] connection:", prev, "→", cur, "reason:", reason);
  });
  useClientEvent(client, "user-joined", (u) => {
    console.log("[Agora] user-joined:", u.uid);
  });
  useClientEvent(client, "user-left", (u) => {
    console.log("[Agora] user-left:", u.uid);
  });

  // toca áudio quando alguém publica
  useClientEvent(client, "user-published", async (user, mediaType) => {
    console.log("[Agora] user-published:", user.uid, mediaType);
    if (mediaType === "audio") {
      try {
        await client.subscribe(user, "audio");
        console.log("[Agora] subscribed ->", user.uid);
        user.audioTrack?.play();
        console.log("[Agora] playing remote audio of", user.uid);
      } catch (err) {
        console.warn("[Agora] subscribe error:", err);
      }
    }
  });

  // para de tocar se despublicar
  useClientEvent(client, "user-unpublished", (user, mediaType) => {
    if (mediaType === "audio") {
      try {
        user.audioTrack?.stop();
      } catch {}
      console.log("[Agora] user-unpublished:", user.uid);
    }
  });

  // ✅ assina quem JÁ estava publicado quando eu entrei
  useEffect(() => {
    (async () => {
      try {
        for (const u of remoteUsers) {
          if (u.hasAudio) {
            console.log("[Agora] late-subscribe to", u.uid);
            await client.subscribe(u, "audio");
            u.audioTrack?.play();
            console.log("[Agora] playing (late) audio of", u.uid);
          }
        }
      } catch (e) {
        console.warn("[Agora] late-subscribe error:", e);
      }
    })();
  }, [remoteUsers, client]);

  // aplica papel quando conectar / trocar desiredRole
  useEffect(() => {
    const applyRole = async () => {
      if (!channel) return;
      if (currentRoleRef.current === desiredRole) return;
      try {
        await client.setClientRole(desiredRole);
        currentRoleRef.current = desiredRole;
        console.log("[Agora] role set:", desiredRole);
      } catch (e) {
        console.warn("[Agora] setClientRole error:", e);
      }
    };
    applyRole();
  }, [client, channel, desiredRole]);

  // logs úteis
  useEffect(() => {
    const id = setInterval(() => {
      console.log(
        "[Agora] state:",
        client.connectionState,
        "| my uid:",
        client.uid,
        "| desiredRole:",
        desiredRole,
        "| micOn:",
        micOn
      );
    }, 1500);
    return () => clearInterval(id);
  }, [client, desiredRole, micOn]);

  // aguarda o CONNECTED antes de promover/publish
  const waitForJoin = useCallback(
    async (maxMs = 2000) => {
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        if (client.connectionState === "CONNECTED") return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    },
    [client]
  );

  // ========= ações expostas =========
  const joinChannel = useCallback(
    async ({ roomId, userId }) => {
      if (!roomId || !userId) return { ok: false, reason: "missing_params" };
      console.log(
        "[Agora] join channel",
        roomId,
        "uid",
        userId,
        "APP_ID",
        !!APP_ID,
        "TOKEN",
        TOKEN ? "yes" : "no"
      );
      setUid(userId);
      setDesiredRole("audience");
      setChannel(roomId);
      socket?.emit?.(
        "joinRoomChat",
        { roomId, currentUserId: userId },
        () => {}
      );
      return { ok: true };
    },
    [socket, APP_ID, TOKEN]
  );

  const joinAsSpeaker = useCallback(
    async ({ roomId }) => {
      if (!roomId) return { ok: false, reason: "missing_roomId" };
      if (!channel) setChannel(roomId);

      const ok = await waitForJoin(2000);
      if (!ok) {
        console.warn("[Agora] join not CONNECTED yet; scheduling host role.");
        setDesiredRole("host");
      } else {
        try {
          await client.setClientRole("host");
          currentRoleRef.current = "host";
          console.log("[Agora] role set -> host (joinAsSpeaker)");
        } catch (e) {
          console.warn("[Agora] setClientRole(host) failed:", e);
          setDesiredRole("host");
        }
      }
      setMicOn(false);
      socket?.emit?.("joinAsSpeaker", { roomId });
      return { ok: true };
    },
    [socket, channel, client, waitForJoin]
  );

  const toggleMicrophone = useCallback(
    async ({ roomId, on }) => {
      if (on && client.connectionState !== "CONNECTED") {
        console.warn("[Agora] toggleMicrophone ignorado: ainda não CONNECTED");
        return;
      }
      if (on && currentRoleRef.current !== "host") {
        const ok = await waitForJoin(2000);
        if (ok) {
          try {
            await client.setClientRole("host");
            currentRoleRef.current = "host";
            console.log("[Agora] escalado para host (toggle)");
          } catch (e) {
            console.warn("[Agora] setClientRole(host) no toggle:", e);
            setDesiredRole("host");
          }
        } else {
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
      setDesiredRole("audience");
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
