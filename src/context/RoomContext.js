// src/context/RoomContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
// Se quiser manter como fallback, deixe importado; caso contrário pode remover:
import {
  addCurrentUserInRoom as apiAddUser,
  removeCurrentUserInRoom as apiRemoveUser,
  addSpeakerToRoom,
  removeSpeakerFromRoom,
} from "../pages/functions/liveRoomFunctions";

const RoomContext = createContext();
export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();

  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);
  const [roomReady, setRoomReady] = useState(false);

  /* -------------------------------- API helpers (opcionais) ------------------- */
  const addCurrentUser = async (roomId, user, baseUrl) => {
    if (!roomId || !user?._id) return;
    // Se o back JÁ persiste no "joinLiveRoom", comente esta linha:
    // await apiAddUser(roomId, user, baseUrl);
  };

  const removeCurrentUser = async (roomId, userId, baseUrl) => {
    if (!roomId || !userId) return;
    // Se o back JÁ remove no "leaveLiveRoom", comente esta linha:
    // await apiRemoveUser(roomId, userId, baseUrl, socket);
    // setCurrentUsers((prev) => prev.filter((u) => String(u._id) !== String(userId)));
  };

  const addSpeaker = async (roomId, user, baseUrl) => {
    if (!roomId || !user?._id) return;
    // Se o back controla speakers via "joinAsSpeaker", pode remover:
    // await addSpeakerToRoom(roomId, user, baseUrl).catch(() => {});
  };

  const removeSpeaker = async (roomId, userId, baseUrl) => {
    if (!roomId || !userId) return;
    // Se o back já resolve no socket, pode ignorar:
    // const updated = await removeSpeakerFromRoom(roomId, userId, baseUrl).catch(() => null);
    // if (updated) setCurrentUsersSpeaking(updated);
  };

  /* ------------------------------- Socket listeners --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onLiveUsers = (payload) => {
      if (!payload) return;
      const { roomId: rid, users = [], speakers } =
        Array.isArray(payload) ? { roomId: currentRoomId, users: payload } : payload;

      // evita aplicar updates de outra sala
      if (currentRoomId && rid && String(rid) !== String(currentRoomId)) return;

      setCurrentUsers(Array.isArray(users) ? users : []);

      const computedSpeakers = Array.isArray(speakers)
        ? speakers
        : users.filter((u) => u.isSpeaker);

      setCurrentUsersSpeaking(computedSpeakers);
      setRoomReady(true);
    };

    socket.on("liveRoomUsers", onLiveUsers);
    return () => socket.off("liveRoomUsers", onLiveUsers);
  }, [socket, currentRoomId]);

  /* ------------------------------ Emit helpers -------------------------------- */
  const joinRoomListeners = (roomId, user) => {
    if (!roomId || !user) return;

    setCurrentRoomId(roomId);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
    setRoomReady(false);

    const emitJoin = () => {
      if (!socket) return;
      socket.emit("joinLiveRoom", { roomId });
    };

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
    // Não precisa mandar userId; o back usa socket.data.userId
    setCurrentRoomId(null);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
    setRoomReady(false);
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
    if (!roomId || !user) return;
    joinRoomListeners(roomId, user);
    // pequeno atraso pra entrar no WS antes de mexer no DB (se mantiver REST)
    // await new Promise((r) => setTimeout(r, 200));
    // await addCurrentUser(roomId, user, baseUrl);
  };

  const handleLeaveRoom = async (roomId, user, baseUrl, leaveChannel, navigate) => {
    if (!roomId) return;

    // 1) WS (faz a remoção e o broadcast no back)
    emitLeaveRoom(roomId);

    // 2) (opcional) REST — se seu back NÃO atualizar o DB no removeUserFromRoom:
    // try {
    //   await fetch(`${baseUrl}/api/rooms/removeMember`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ roomId, userId: user?._id }),
    //   });
    // } catch (err) {
    //   console.error("❌ Erro ao remover do banco:", err);
    // }

    // 3) (opcional) otimismo local, caso queira ver sumir na hora:
    // setCurrentUsers((prev) => prev.filter((u) => String(u._id) !== String(user?._id)));
    // setCurrentUsersSpeaking((prev) => prev.filter((u) => String(u._id) !== String(user?._id)));

    // 4) UI/voz
    clearMinimizedRoom();
    setHasJoinedBefore(false);

    try {
      await leaveChannel?.();
    } finally {
      navigate?.("/");
    }
  };

  return (
    <RoomContext.Provider
      value={{
        roomReady,
        minimizedRoom,
        micOpen,
        hasJoinedBefore,
        currentRoomId,
        currentUsers,
        currentUsersSpeaking,
        setCurrentUsersSpeaking,
        setCurrentUsers,
        minimizeRoom,
        clearMinimizedRoom,
        leaveRoom,
        joinRoom,
        joinRoomListeners,
        emitLeaveRoom,
        emitJoinAsSpeaker,
        addCurrentUser,     // opcionais
        removeCurrentUser,  // opcionais
        addSpeaker,         // opcionais
        removeSpeaker,      // opcionais
        handleJoinRoom,
        handleLeaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
