import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext";

const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

export default function AudioProvider({ children }) {
  const client = React.useMemo(
    () => AgoraRTC.createClient({ mode: "live", codec: "vp8" }),
    []
  );

  const { currentUser } = useUser();
  const { room, roomId } = useRoom();

  const channel = roomId ?? room?._id ?? null;
  const userId = currentUser?._id ?? null;

  // abaixo de micTrackRef
  const micOnRef = useRef(false);
  const [micOnState, setMicOnState] = React.useState(false);

  const APP_ID = process.env.REACT_APP_AGORA_APP_ID || "";
  // Deixe SEM token fixo no front:
  // const TOKEN_ENV = process.env.REACT_APP_AGORA_TOKEN || null;

  // Guarda a track local para start/stop
  const micTrackRef = useRef(null);

  // ===== Helpers de token dinâmico =====
  // Adapte a rota ao seu backend. Deve retornar { token, uid? }.
  const fetchRtcToken = useCallback(
    async (channelName, role = "publisher", uidHint) => {
      // Exemplo GET; se seu back for POST, ajuste:
      const qs = new URLSearchParams({
        channel: channelName,
        role, // "publisher" ou "audience"
        // opcional: se quiser forçar uid numérico gerado no servidor:
        // uid: uidHint ? String(uidHint) : ""
      });
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/agora/rtcToken?${qs.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`rtcToken http ${res.status}`);
      const data = await res.json();
      // data: { token: "xxxxx", uid?: number|string }
      return data;
    },
    []
  );

  // join robusto: busca token, tenta join e trata token expirado
  // AudioContext.js
  const ensureJoined = useCallback(
    async (channelName, userId, tokenFromServer = null) => {
      console.log("[Audio.ensureJoined] state:", client.connectionState, {
        channelName,
        userId,
      });
      if (!APP_ID) {
        console.error("APP_ID ausente");
        return false;
      }
      if (!channelName) {
        console.warn("channel ausente");
        return false;
      }

      // Se já conectado, mas em canal diferente, sai e entra de novo
      const sameChannel =
        client.connectionState === "CONNECTED" &&
        (client.channelName === channelName ||
          client.channelName === String(channelName));
      if (sameChannel) return true;
      if (client.connectionState !== "DISCONNECTED") {
        try {
          await client.leave();
        } catch {}
      }

      try {
        const joinedUid = await client.join(
          APP_ID,
          channelName,
          tokenFromServer ?? null, // << usa token se tiver; senão null (somente se seu projeto Agora estiver sem certificate)
          userId ?? null
        );
        console.log("JOIN OK, my uid:", joinedUid);
        return true;
      } catch (e) {
        console.error("JOIN FAILED:", e?.code || e?.name, e?.message, e);
        return false;
      }
    },
    [client, APP_ID]
  );

  async function requestMicPreflight() {
    const stream = await navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .catch((e) => {
        throw e;
      });
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  // Listeners principais (uma vez)
  useEffect(() => {
    const onUserPublished = async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack?.play();
      } catch (e) {
        console.warn("[Agora] subscribe error:", e);
      }
    };
    const onUserUnpublished = (user, mediaType) => {
      if (mediaType === "audio") {
        try {
          user.audioTrack?.stop();
        } catch {}
      }
    };
    client.on("user-published", onUserPublished);
    client.on("user-unpublished", onUserUnpublished);
    return () => {
      client.off("user-published", onUserPublished);
      client.off("user-unpublished", onUserUnpublished);
    };
  }, [client]);

  // Start/stop mic
  const startMic = useCallback(async () => {
    if (client.connectionState !== "CONNECTED") {
      console.warn("Mic: client ainda não CONNECTED");
      return false;
    }
    if (micTrackRef.current) return true;

    try {
      try {
        await client.setClientRole("host");
      } catch {}
      // dispara prompt do navegador (se nunca concedeu)
      try {
        await requestMicPreflight();
      } catch (e) {
        console.error("Permissão de microfone negada no preflight:", e);
        return false;
      }

      const track = await AgoraRTC.createMicrophoneAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      micTrackRef.current = track;
      await client.publish([track]);
      micOnRef.current = true;
      setMicOnState(true);
      console.log("🎙️ Microfone publicado");
      return true;
    } catch (e) {
      // diagnóstico amigável
      const msg = String(e?.message || e?.name || "");
      if (msg.includes("NotAllowedError")) {
        console.error(">> Navegador bloqueou o microfone para este site.");
      } else if (msg.includes("NotFoundError")) {
        console.error(">> Nenhum dispositivo de áudio encontrado.");
      } else if (msg.includes("AbortError")) {
        console.error(
          ">> getUserMedia abortado (talvez outra aba esteja usando o mic)."
        );
      } else {
        console.error("Erro ao iniciar microfone:", e);
      }
      return false;
    }
  }, [client]);

  const stopMic = useCallback(async () => {
    const track = micTrackRef.current;
    if (!track) return true;
    try {
      await client.unpublish([track]);
    } catch {}
    try {
      track.stop();
      track.close();
    } catch {}
    micTrackRef.current = null;
    micOnRef.current = false;
    setMicOnState(false);
    console.log("🔇 Microfone parado");
    return true;
  }, [client]);

  const leave = useCallback(async () => {
    await stopMic();
    try {
      await client.leave();
    } catch (e) {
      console.warn("leave error:", e);
    }
  }, [client, stopMic]);

  // (Opcional) Auto-join quando mudar roomId — pode deixar desligado se controla no botão
  // useEffect(() => {
  //   if (!channel || !userId) return;
  //   ensureJoined(channel, userId);
  // }, [channel, userId, ensureJoined]);

  // Cleanup ao desmontar
  useEffect(
    () => () => {
      client?.leave?.().catch(() => {});
    },
    [client]
  );

  const value = useMemo(
    () => ({
      ensureJoined,
      startMic,
      stopMic,
      leave,
      get state() {
        return client.connectionState;
      },
      get myUid() {
        return client.uid;
      },
      get micOn() {
        return micOnRef.current;
      },
      micOnState, // opcional, reativo
    }),
    [client, ensureJoined, startMic, stopMic, leave, micOnState]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
