import React, { createContext, useState, useContext, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";

const RoomContext = createContext();

export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const socket = useSocket();
  const { user } = useUser();

  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);

  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]); // ouvintes
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]); // no palco

  // ▶️ Entrar na sala
  const joinRoomListeners = (roomId, user) => {
    console.log("roomId:", roomId);
    console.log("user:", user);

    console.log("joinRoomListener socket call");
    if (!roomId || !user) {
      console.warn("▶️ joinRoomListeners: Dados ausentes");
      return;
    }

    const userPayload = {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage,
    };

    setCurrentRoomId(roomId);

    const emitEvents = () => {
      console.log("🎤 Emitindo eventos de entrada:", userPayload);

      socket.emit("joinRoom", { roomId, user: userPayload });

      socket.off("liveRoomUsers");
      socket.on("liveRoomUsers", (users) => {
        console.log("📡 Recebido liveRoomUsers do servidor:", users);
        setCurrentUsers(users || []);
      });

      socket.on("updateSpeakers", (speakers) => {
        console.log("📣 Recebido updateSpeakers:", speakers);
        setCurrentUsersSpeaking(speakers || []);
      });

      socket.on("userLeavesStage", ({ userId }) => {
        setCurrentUsersSpeaking((prev) => prev.filter((u) => u._id !== userId));
      });
    };

    if (socket?.connected) {
      emitEvents();
    } else {
      socket.once("connect", () => {
        console.log("🔌 Socket reconectado");
        emitEvents();
      });
    }
  };

  // entrando na sala
  const emitJoinAsSpeaker = (roomId, user, micState) => {
    console.log("2️⃣")
    console.log("RoomContext emitJoinAsSpeaker chamado");
    console.log("userId:", roomId);
    console.log("user:", user);

    if (!socket || !roomId || !user) return;

    const payload = {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage,
      micOpen: micState,
      isSpeaker: true,
    };

    if (!socket?.connected) {
      console.warn("⚠️ Socket ainda não conectado. Aguardando...");
      socket.once("connect", () => {
        console.log("🔁 Socket conectado. Emitindo joinAsSpeaker...");
        socket.emit("joinAsSpeaker", { roomId, user: payload });
      });
    } else {
      console.log("✅ Socket conectado. Emitindo joinAsSpeaker...");
      console.log("➡️ roomId:", roomId);
      console.log("➡️ payload (user):", payload);
      console.log("socket.emit('joinAsSpeaker'...)")
      socket.emit("joinAsSpeaker", { roomId, user: payload });
    }
  };

  // ❌ Sair da sala
  const emitLeaveRoom = (roomId, userId) => {
    if (!roomId || !userId) return;

    socket.emit("userLeavesRoom", {
      roomId,
      userId,
    });

    setCurrentRoomId(null);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
  };

  // ⬇️ Minimizar sala
  const minimizeRoom = (room, microphoneOn) => {
    if (!room || typeof room !== "object") return;

    setMinimizedRoom({ ...room, microphoneOn });
    setMicOpen(microphoneOn);
  };

  const clearMinimizedRoom = () => {
    setMinimizedRoom(null);
    setMicOpen(false);
  };

  const leaveRoom = () => {
    if (!minimizedRoom || !user) return;

    emitLeaveRoom(minimizedRoom._id, user._id);
    clearMinimizedRoom();
    setHasJoinedBefore(false);
  };

  const joinRoom = (room) => {
    if (!room) return;

    if (!hasJoinedBefore) {
      setMicOpen(false);
      setHasJoinedBefore(true);
    }

    setMinimizedRoom(room);
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("currentUsersInRoom");
        socket.off("updateSpeakers"); // <- correto agora
        socket.off("userLeavesStage"); // ok, se ainda estiver usando
      }
    };
  }, [socket]);

  return (
    <RoomContext.Provider
      value={{
        minimizedRoom,
        micOpen,
        hasJoinedBefore,
        currentRoomId,
        currentUsers,
        currentUsersSpeaking,
        setCurrentUsersSpeaking,
        minimizeRoom,
        clearMinimizedRoom,
        leaveRoom,
        joinRoom,
        joinRoomListeners,
        emitLeaveRoom,
        emitJoinAsSpeaker,
        setCurrentUsers,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
