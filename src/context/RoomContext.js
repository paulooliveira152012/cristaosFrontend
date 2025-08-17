// src/context/RoomContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
import {
  addCurrentUserInRoom as apiAddUser,
  removeCurrentUserInRoom as apiRemoveUser,
  addSpeakerToRoom,
  removeSpeakerFromRoom,
} from "../pages/functions/liveRoomFunctions";

const RoomContext = createContext();
export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const { socket } = useSocket(); // ✅ desestruturação correta
  const { currentUser } = useUser(); // ✅ padroniza nome

  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);
  const [roomReady, setRoomReady] = useState(false);

  /* -------------------------------- API helpers ------------------------------- */
  const addCurrentUser = async (roomId, user, baseUrl) => {
    if (!roomId || !user?._id) return;
    // Se o back novo já persiste no joinLiveRoom, você pode remover esta linha:
    await apiAddUser(roomId, user, baseUrl);
  };

  const removeCurrentUser = async (roomId, userId, baseUrl) => {
    if (!roomId || !userId) return;
    await apiRemoveUser(roomId, userId, baseUrl, socket);
    setCurrentUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const addSpeaker = async (roomId, user, baseUrl) => {
    if (!roomId || !user?._id) return;
    // Se o back novo já controla speakers via socket (joinAsSpeaker), pode omitir:
    await addSpeakerToRoom(roomId, user, baseUrl).catch(() => {});
  };

  const removeSpeaker = async (roomId, userId, baseUrl) => {
    if (!roomId || !userId) return;
    const updated = await removeSpeakerFromRoom(roomId, userId, baseUrl).catch(
      () => null
    );
    if (updated) setCurrentUsersSpeaking(updated);
  };

  /* ------------------------------- Socket listeners --------------------------- */
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const onLiveUsers = (users) => {
      // console.log("📣 liveRoomUsers:", users);
      setCurrentUsers(users || []);
      setTimeout(() => setRoomReady(true), 50);
    };

    const onSpeakers = (speakers) => {
      // console.log("🎤 updateSpeakers:", speakers);
      setCurrentUsersSpeaking(speakers || []);
    };

    // Opcional (se o servidor ainda emite):
    const onUserLeft = ({ userId }) => {
      setCurrentUsers((prev) =>
        prev.filter((u) => String(u._id) !== String(userId))
      );
      setCurrentUsersSpeaking((prev) =>
        prev.filter((u) => String(u._id) !== String(userId))
      );
    };

    socket.on("liveRoomUsers", onLiveUsers);
    socket.on("updateSpeakers", onSpeakers);
    socket.on("userLeft", onUserLeft);

    return () => {
      socket.off("liveRoomUsers", onLiveUsers);
      socket.off("updateSpeakers", onSpeakers);
      socket.off("userLeft", onUserLeft);
    };
  }, [socket]);

  /* ------------------------------ Emit helpers -------------------------------- */
  const joinRoomListeners = (roomId, user) => {
    if (!roomId || !user) return;

    setCurrentRoomId(roomId);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);

    const emitJoin = () => {
      if (!socket || typeof socket.emit !== "function") return;
      // ✅ novo nome de evento (back limpo)
      socket.emit("joinLiveRoom", { roomId });

      // 🔙 fallback (se ainda existir o handler antigo):
      socket.emit("joinRoom", {
        roomId,
        user: {
          _id: user._id,
          username: user.username,
          profileImage: user.profileImage,
        },
      });
    };

    if (socket?.connected) emitJoin();
    else socket?.once?.("connect", emitJoin);
  };

  const emitJoinAsSpeaker = (roomId, user) => {
    if (!roomId || !user || !socket || typeof socket.emit !== "function")
      return;
    socket.emit("joinAsSpeaker", { roomId });
    // fallback antigo:
    socket.emit("joinAsSpeaker", { roomId, userId: user._id });
  };

  const emitLeaveRoom = (roomId) => {
    if (!roomId || !socket || typeof socket.emit !== "function") return;
    // ✅ novo
    socket.emit("leaveLiveRoom", { roomId });
    // 🔙 antigo
    socket.emit("userLeavesRoom", { roomId, userId: currentUser?._id });
    setCurrentRoomId(null);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
  };

  const minimizeRoom = (room, microphoneOn) => {
    if (!room) return;
    setMinimizedRoom({ ...room, microphoneOn });
    setMicOpen(microphoneOn);

    // Se o back novo usa "minimizeUser":
    if (socket?.connected && typeof socket.emit === "function") {
      socket.emit("minimizeUser", { roomId: room._id });
      // fallback antigo:
      socket.emit("minimizeRoom", {
        roomId: room._id,
        userId: currentUser?._id,
        microphoneOn,
      });
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
      if (!socket || typeof socket.emit !== "function") return;
      if (currentRoomId && currentUser?._id) {
        socket.emit("leaveLiveRoom", { roomId: currentRoomId });
        socket.emit("userLeavesRoom", {
          roomId: currentRoomId,
          userId: currentUser._id,
        }); // fallback
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [socket, currentRoomId, currentUser?._id]);

  /* ----------------------------- Orquestração --------------------------------- */
  const handleJoinRoom = async (roomId, user, baseUrl) => {
    if (!roomId || !user) return;
    joinRoomListeners(roomId, user);
    // pequeno atraso pra entrar no WS antes de mexer no DB
    await new Promise((r) => setTimeout(r, 200));
    await addCurrentUser(roomId, user, baseUrl);
  };

  const handleLeaveRoom = async (
    roomId,
    user,
    baseUrl,
    leaveChannel,
    navigate
  ) => {
    if (!roomId || !user?._id) return;

    // 1) WS
    emitLeaveRoom(roomId);

    // 2) DB
    try {
      await fetch(`${baseUrl}/api/rooms/removeMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userId: user._id }),
      });
    } catch (err) {
      console.error("❌ Erro ao remover do banco:", err);
    }

    // 3) Estado local
    await removeCurrentUser(roomId, user._id, baseUrl);
    await removeSpeaker(roomId, user._id, baseUrl);

    // 4) UI/voz
    clearMinimizedRoom();
    setHasJoinedBefore(false);

    try {
      await leaveChannel?.();
      navigate?.("/");
    } catch (err) {
      console.error("❌ Erro ao sair do canal de voz:", err);
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
        addCurrentUser,
        removeCurrentUser,
        addSpeaker,
        removeSpeaker,
        handleJoinRoom,
        handleLeaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
