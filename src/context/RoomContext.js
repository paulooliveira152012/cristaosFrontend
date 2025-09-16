// src/context/RoomContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
import {
  startLiveCore,
  fetchRoomData,
} from "./functions.js/roomContextFunctions";

const RoomContext = createContext();
export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();

  const baseUrl =
    process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";

  const [room, setRoom] = useState(null);
  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);
  const [roomReady, setRoomReady] = useState(false);
  const [isRoomLive, setIsRoomLive] = useState(false);
  const [isCreator, setIsCreator] = useState(false)

  // ==================================================================
  // 👇 verifica se um userId está em currentUsersSpeaking (sem normalização elaborada)
  // ==================================================================
  const isUserSpeaker = useCallback(
    (userId) => {
      if (!userId || !Array.isArray(currentUsersSpeaking)) return false;
      return currentUsersSpeaking.some(
        (s) => String(s?._id || s?.userId || s?.user?._id) === String(userId)
      );
    },
    [currentUsersSpeaking]
  );

  // 👇 booleano pronto pro usuário atual
  const isCurrentUserSpeaker = useMemo(
    () => isUserSpeaker(currentUser?._id),
    [isUserSpeaker, currentUser?._id]
  );

  // ==================================================================
  // ==================================================================

  // Normaliza speakers vindos do back (Room.speakers) para o estado atual
  const setSpeakersFromRoom = (roomObj) => {
    const arr = Array.isArray(roomObj?.speakers) ? roomObj.speakers : [];
    setCurrentUsersSpeaking(arr);
  };

  // ⬇️ Função única para buscar a sala do backend e sincronizar estados
  const refreshRoom = useCallback(
    async (rid = currentRoomId) => {
      if (!rid || !baseUrl) return null;
      try {
        const data = await fetchRoomData({ roomId: rid, baseUrl, currentUser, setIsCreator });
        if (data) {
          setRoom(data);
          setSpeakersFromRoom(data);
          setRoomReady(true);
        }
        return data;
      } catch (e) {
        console.error("refreshRoom error:", e);
        return null;
      }
    },
    [currentRoomId, baseUrl]
  );

  const startLive = useCallback(
    async ({ roomId, joinChannel, setIsSpeaker, setIsLive }) => {
      try {
        if (!currentUser?._id || !roomId) {
          console.log("currentUser:", currentUser?._id);
          console.log("roomId:", roomId);

          console.warn("startLive: missing currentUser or roomId");
          return { ok: false, reason: "missing_params" };
        }

        // evita reiniciar se já está live
        if (room?._id === roomId && room?.isLive) {
          setIsSpeaker?.(true);
          setIsLive?.(true);
          setIsRoomLive(true)
          return { ok: true, already: true };
        }

        const result = await startLiveCore({
          baseUrl,
          currentUser,
          roomId,
          joinChannel,
        });

        if (!result.ok) {
          if (result.status === 401 || result.status === 403) {
            alert("Você não tem permissão para iniciar a live desta sala.");
          } else {
            console.error("startLiveCore error:", result);
            alert("Não foi possível iniciar o áudio.");
          }
          return result;
        }

        // otimismo local
        setIsSpeaker?.(true);
        setIsLive?.(true);

        // sincroniza com back (isLive/speakers/etc.)
        await refreshRoom(roomId);

        return result;
      } catch (e) {
        console.error("startLive wrapper error:", e);
        alert("Não foi possível iniciar o áudio.");
        return { ok: false, error: e };
      }
    },
    [baseUrl, currentUser?._id, room?._id, room?.isLive, refreshRoom]
  );

  // Buscar quando a sala atual muda
  useEffect(() => {
    if (currentRoomId) refreshRoom(currentRoomId);
  }, [currentRoomId, refreshRoom]);


  // ==================== useEffects
  // Buscar quando a sala atual muda
  // useEffect(() => {
  //   if (currentRoomId) refreshRoom(currentRoomId);
  // }, [currentRoomId, refreshRoom]);

  // update speakers
  // useEffect(() => {
  //   console.log("updating speakers...")
  //   fetchRoomData(roomId)
  //   setRoom(data)
  // })

  /* ------------------------------- Socket listeners --------------------------- */
  /* ------------------------------- Socket listeners --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onLiveUsers = (payload) => {
      if (!payload) return;
      const {
        roomId: rid,
        users = [],
        speakers,
      } = Array.isArray(payload)
        ? { roomId: currentRoomId, users: payload }
        : payload;

      // aplica só se for a sala atual
      if (currentRoomId && rid && String(rid) !== String(currentRoomId)) return;

      setCurrentUsers(Array.isArray(users) ? users : []);
      const computedSpeakers = Array.isArray(speakers)
        ? speakers
        : users.filter((u) => u.isSpeaker);
      setCurrentUsersSpeaking(computedSpeakers);
      setRoomReady(true);
    };

    // quando o backend diz que a live mudou, recarrega a sala (garante isLive/speakersCount/etc)
    const onRoomLive = ({ roomId: rid }) => {
      if (String(rid) === String(currentRoomId)) refreshRoom(rid);
    };

    socket.on("liveRoomUsers", onLiveUsers);
    socket.on("room:live", onRoomLive);
    // opcional: refresh leve quando chega liveRoomUsers
    const onUsersAndMaybeRefresh = async (payload) => {
      onLiveUsers(payload);
      if (currentRoomId) refreshRoom(currentRoomId);
    };
    socket.off("liveRoomUsers", onLiveUsers);
    socket.on("liveRoomUsers", onUsersAndMaybeRefresh);
    return () => {
      socket.off("liveRoomUsers", onLiveUsers);
      socket.off("liveRoomUsers", onUsersAndMaybeRefresh);
      socket.off("room:live", onRoomLive);
    };
  }, [socket, currentRoomId, refreshRoom]);

  /* ------------------------------ Emit helpers -------------------------------- */
  const joinRoomListeners = (roomId, user) => {
    console.log("🚨🚨🚨🚨🚨");
    if (!roomId || !user) return;

    setCurrentRoomId(roomId);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
    setRoomReady(false);

    const emitJoin = () => socket?.emit?.("joinLiveRoom", { roomId });
    if (socket?.connected) emitJoin();
    else socket?.once?.("connect", emitJoin);
  };

  const emitJoinAsSpeaker = (roomId, user) => {
    if (!roomId || !user || !socket) return;
    socket.emit("joinAsSpeaker", { roomId });
  };

  const emitLeaveRoom = (roomId) => {
    if (!roomId || !socket) return;
    socket.emit("leaveLiveRoom", { roomId });
    setCurrentRoomId(null);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
    setRoomReady(false);
    setRoom(null);
  };

  const minimizeRoom = (room, microphoneOn) => {
    if (!room) return;
    setMinimizedRoom({ ...room, microphoneOn });
    setMicOpen(microphoneOn);

    if (socket?.connected) {
      socket.emit("minimizeUser", { roomId: room._id });
    }
  };

  const clearMinimizedRoom = () => {
    setMinimizedRoom(null);
    setMicOpen(false);
  };

  const leaveRoom = () => {
    if (!minimizedRoom || !currentUser) return;
    emitLeaveRoom(minimizedRoom._id);
    clearMinimizedRoom();
    setHasJoinedBefore(false);
  };

  const joinRoom = (room) => {
    if (!room) return;
    if (!hasJoinedBefore) setMicOpen(false);
    setHasJoinedBefore(true);
    setMinimizedRoom(room);
  };

  // Sair automaticamente ao fechar aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!socket) return;
      if (currentRoomId && currentUser?._id) {
        socket.emit("leaveLiveRoom", { roomId: currentRoomId });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [socket, currentRoomId, currentUser?._id]);

  /* ----------------------------- Orquestração --------------------------------- */
  const handleJoinRoom = async (roomId, user, baseUrl) => {
    console.log("✅ adicionando usuario na sala pelo RoomContext");

    if (!roomId || !user) {
      console.warn("roomId ou user._id ausente", { roomId, user });
      return null;
    }

    // 1) Entra no WS primeiro (se for async, await)
    try {
      const maybePromise = joinRoomListeners?.(roomId, user);
      if (maybePromise?.then) await maybePromise;
    } catch (e) {
      console.error("Erro ao entrar no WS:", e);
      // opcional: decidir se deve abortar aqui
    }

    console.log("🇧🇷", roomId, "e", user, "presentes, prosseguindo");
    // 2) Atualiza no backend (REST)
    try {
      const res = await fetch(`${baseUrl}/api/rooms/addCurrentUser`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, user }),
      });

      // Alguns endpoints podem responder 204 (sem corpo)
      let data = null;
      if (res.status !== 204) {
        try {
          data = await res.json();
        } catch {
          // corpo vazio ou inválido — ok se o status for 2xx
        }
      }

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status} - ${data?.message || res.statusText}`
        );
      }

      console.log("✔️ addCurrentUser OK:", data);
      setCurrentUsers(data.currentUsersInRoom);

      console.log("Usuarios atuais na sala do roomContext:", currentUser);
      return data;
    } catch (err) {
      console.error("🇧🇷 erro addCurrentUser:", err);
      return null;
    }
  };

  const handleLeaveRoom = async ({
    roomId,
    user,
    baseUrl,
    leaveChannel,
    navigate,
    ownerId,
    isSpeaker,
  }) => {
    if (!roomId) return;
    console.log("exeting room in context...");
    console.log("isOwner?", ownerId);

    // 0) Se for o LÍDER da sala: encerra a live no backend
    try {
      if (ownerId && user?._id && String(ownerId) === String(user._id)) {
        await fetch(`${baseUrl}/api/rooms/${roomId}/live/stop`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
      } else if (isSpeaker) {
        // Se não é líder mas está no palco, desce do palco
        await fetch(`${baseUrl}/api/rooms/${roomId}/speakers/leave`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user._id }),
        });
      }
    } catch (e) {
      console.error("Erro ao encerrar/descer do palco:", e);
    }

    // 1) WS (faz a remoção e o broadcast no back)
    emitLeaveRoom(roomId);
    // 4) UI/voz
    clearMinimizedRoom();
    setHasJoinedBefore(false);

    try {
      await leaveChannel?.();
    } finally {
      console.log("navigating to main screen...");
      navigate?.("/");
    }
  };

  return (
    <RoomContext.Provider
      value={{
        room,
        isRoomLive,
        startLive,
        refreshRoom,
        roomReady,
        minimizedRoom,
        micOpen,
        hasJoinedBefore,
        currentRoomId,
        currentUsers,
        currentUsersSpeaking,
        isUserSpeaker,
        isCurrentUserSpeaker,
        setCurrentUsersSpeaking,
        setCurrentUsers,
        minimizeRoom,
        clearMinimizedRoom,
        leaveRoom,
        joinRoom,
        joinRoomListeners,
        emitLeaveRoom,
        emitJoinAsSpeaker,
        handleJoinRoom,
        handleLeaveRoom,
        isCreator,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
