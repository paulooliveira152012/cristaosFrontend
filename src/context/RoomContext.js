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
    console.log("roomId:", roomId)
    console.log("user:", user)

    console.log("joinRoomListener socket call")
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
      socket.emit("userJoinsRoom", { roomId, user: userPayload });

      socket.off("liveRoomUsers");
      socket.on("liveRoomUsers", (users) => {
        console.log("📡 Recebido liveRoomUsers do servidor:", users);
        setCurrentUsers(users || []);
      });

      socket.on("userJoinsStage", ({ user }) => {
        if (!user) return;

        setCurrentUsersSpeaking((prev) => {
          const alreadyIn = prev.some((u) => u._id === user._id);
          return alreadyIn ? prev : [...prev, user];
        });
      });

      socket.on("userLeavesStage", ({ userId }) => {
        setCurrentUsersSpeaking((prev) =>
          prev.filter((u) => u._id !== userId)
        );
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
        socket.off("userJoinsStage");
        socket.off("userLeavesStage");
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
        setCurrentUsers,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};