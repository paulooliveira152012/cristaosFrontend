import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext";

const MainAudioContext = createContext(null);
export const useMainAudio = () => useContext(MainAudioContext);

export default function MainAudioProvider({ children }) {
  // Client único
  const client = useMemo(
    () => AgoraRTC.createClient({ mode: "live", codec: "vp8" }),
    []
  );

  const { currentUser } = useUser();
  const { room } = useRoom();

  // Ids vindos dos outros contextos
  const uid = currentUser?._id ?? null;
  const channel = room?._id ?? null;

  // ENV (garante null real pro token)
  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  const TOKEN =
    process.env.REACT_APP_AGORA_TOKEN &&
    process.env.REACT_APP_AGORA_TOKEN !== "null"
      ? process.env.REACT_APP_AGORA_TOKEN
      : null;

  // Track local (microfone)
  const micTrackRef = useRef(null);

  // ---------- 1) Listeners do Agora (registrar uma vez) ----------
  useEffect(() => {
    const onUserPublished = async (user, mediaType) => {
      console.log("[Agora] user-published:", user.uid, mediaType);
      try {
        await client.subscribe(user, mediaType);
        console.log("[Agora] subscribed to", user.uid, mediaType);

        if (mediaType === "audio" && user.audioTrack) {
          user.audioTrack.play(); // cria <audio> e toca
          console.log("[Agora] playing remote audio of", user.uid);
        }
      } catch (e) {
        console.warn("[Agora] subscribe error:", e);
      }
    };

    const onUserUnpublished = (user, mediaType) => {
      console.log("[Agora] user-unpublished:", user.uid, mediaType);
      if (mediaType === "audio") {
        try {
          user.audioTrack?.stop();
        } catch {}
      }
    };

    const onConn = (cur, prev, reason) => {
      console.log("[Agora] connection:", prev, "→", cur, "reason:", reason);
    };

    client.on("user-published", onUserPublished);
    client.on("user-unpublished", onUserUnpublished);
    client.on("connection-state-change", onConn);

    return () => {
      client.off("user-published", onUserPublished);
      client.off("user-unpublished", onUserUnpublished);
      client.off("connection-state-change", onConn);
    };
  }, [client]);

  // ---------- 2) Entrar / sair do canal quando room/uid mudarem ----------
  useEffect(() => {
    let cancelled = false;

    const join = async () => {
      if (!channel) return; // sem sala
      if (!APP_ID) {
        console.error("🚨 REACT_APP_AGORA_APP_ID ausente");
        return;
      }

      // Segurança: sair de sessão anterior
      if (client.connectionState !== "DISCONNECTED") {
        try {
          console.log("↩️ leaving previous channel before join");
          await client.leave();
        } catch {}
      }

      console.log("🟢 Joining Agora:", {
        appId: APP_ID.slice(0, 6) + "...",
        channel,
        hasToken: !!TOKEN,
        uid,
      });

      try {
        const joinedUid = await client.join(
          APP_ID,
          channel,
          TOKEN,
          uid || null
        );
        if (cancelled) return;
        console.log(
          "✅ JOIN OK — my uid:",
          joinedUid,
          "| state:",
          client.connectionState
        );
      } catch (e) {
        if (!cancelled) {
          console.error("❌ JOIN FAILED:", e?.code || e?.name, e?.message, e);
        }
      }
    };

    join();

    return () => {
      cancelled = true;
      // Não dá leave aqui: o leave acontece automaticamente no próximo join acima.
      // Se quiser sair ao desmontar totalmente o provider, trate no unmount do App.
    };
  }, [client, APP_ID, TOKEN, channel, uid]);

  // ---------- 3) Controles de microfone (opcional p/ teste) ----------
  const startMic = async () => {
    if (client.connectionState !== "CONNECTED") {
      console.warn("Mic: client ainda não CONNECTED");
      return;
    }
    if (micTrackRef.current) {
      console.log("Mic já ativo");
      return;
    }
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = track;
      await client.publish([track]);
      console.log("🎙️ Microfone publicado");
    } catch (e) {
      console.error("Erro ao iniciar microfone:", e);
    }
  };

  const stopMic = async () => {
    const track = micTrackRef.current;
    if (!track) return;
    try {
      await client.unpublish([track]);
    } catch {}
    try {
      track.stop();
      track.close();
    } catch {}
    micTrackRef.current = null;
    console.log("🔇 Microfone parado");
    // Observação: você ainda continua no canal, só sem publicar áudio.
  };

  const leave = async () => {
    await stopMic();
    try {
      await client.leave();
      console.log("🚪 Left channel");
    } catch (e) {
      console.warn("leave error:", e);
    }
  };

  const value = useMemo(
    () => ({
      startMic,
      stopMic,
      leave,
      get state() {
        return client.connectionState;
      },
      get myUid() {
        return client.uid;
      },
    }),
    [client]
  );

  useEffect(() => {
    return () => {
      client?.leave?.().catch(() => {});
    };
  }, [client]);

  return (
    <MainAudioContext.Provider value={value}>
      {children}
    </MainAudioContext.Provider>
  );
}
