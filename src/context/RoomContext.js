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
  const [currentUsers, setCurrentUsers] = useState([]);

  // entrando na sala
  const joinRoomListeners = (roomId) => {
    console.log("🧪 Tentando emitir userJoinsRoom...");
    console.log("socket connected:", socket?.connected);
    console.log("user:", user);
    console.log("roomId:", roomId);

    if (!roomId || !user) {
      console.log("⚠️ Dados ausentes: roomId ou user nulo.");
      return;
    }

    const userPayload = {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage,
    };

    setCurrentRoomId(roomId);

    const emitJoinEvents = () => {
      console.log("🔌 Emitindo userJoinsRoom com socket ID:", socket?.id);
      console.log("🎯 Dados:", roomId, user?.username);

      socket.emit("joinRoom", {
        roomId,
        user: userPayload,
      });

      socket.emit("userJoinsRoom", {
        roomId,
        user: userPayload,
      });

      socket.on("currentUsersInRoom", (users) => {
        setCurrentUsers(users);
      });
    };

    if (socket?.connected) {
      emitJoinEvents();
    } else {
      console.warn("⏳ Aguardando conexão do socket...");
      socket.once("connect", () => {
        console.log("🟢 Socket conectado! Agora sim, emitindo eventos.");
        emitJoinEvents();
      });
    }
  };

  // ❌ Sair da sala (ou fechar aba)
  const emitLeaveRoom = (roomId) => {
    if (!roomId || !user) return;

    socket.emit("userLeavesRoom", {
      roomId,
      userId: user._id,
    });

    setCurrentRoomId(null);
    setCurrentUsers([]);
  };

  // ⬇️ Minimizar
  const minimizeRoom = (room, microphoneOn) => {
    if (!room || typeof room !== "object") {
      console.error("Room data is not a valid object:", room);
      return;
    }

    setMinimizedRoom({ ...room, microphoneOn });
    setMicOpen(microphoneOn);
    console.log(`Room "${room.roomTitle}" minimized with mic: ${microphoneOn}`);
  };

  const clearMinimizedRoom = () => {
    if (!minimizedRoom) return;
    console.log(`Cleared minimized room "${minimizedRoom.roomTitle}"`);
    setMinimizedRoom(null);
    setMicOpen(false);
  };

  const leaveRoom = () => {
    if (!minimizedRoom || !user) return;

    emitLeaveRoom(minimizedRoom._id);
    clearMinimizedRoom();
    setHasJoinedBefore(false);
    console.log("Left the room and reset states.");
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
