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
  const socket = useSocket();
  const { user } = useUser();

  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);

  // ➕ Add user como ouvinte
  const addCurrentUser = async (roomId, currentUser, baseUrl) => {
    if (!roomId || !currentUser?._id) return;
    const users = await apiAddUser(roomId, currentUser, baseUrl);
    if (users) setCurrentUsers(users);
  };

  // ➖ Remove user da sala
  const removeCurrentUser = async (roomId, userId, baseUrl) => {
    console.log("1️⃣🟢🟢🟢removendo usuario dos currentUsers no RoomContext.js...")
    if (!roomId || !userId) return;
    await apiRemoveUser(roomId, userId, baseUrl, socket);
    setCurrentUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  // 🎤 Adicionar speaker
  const addSpeaker = async (roomId, user, baseUrl) => {
    if (!roomId || !user?._id) return;
    const updated = await addSpeakerToRoom(roomId, user, baseUrl);
    if (updated) setCurrentUsersSpeaking(updated);
  };

  // 🔇 Remover speaker
  const removeSpeaker = async (roomId, userId, baseUrl) => {
    console.log("🔇🔇🔇 removendo usuario do speaker...")
    if (!roomId || !userId) return;
    const updated = await removeSpeakerFromRoom(roomId, userId, baseUrl);
    if (updated) setCurrentUsersSpeaking(updated);
  };

  // useEffect de notificar usuarios que entram e saem da sala:
  // 🔄 Escutar atualizações de ouvintes (users na sala)
useEffect(() => {
  if (!socket) return;

  const handleUpdateListeners = (users) => {
    console.log("📣 Atualização recebida via socket de currentUsers:", users);
    setCurrentUsers(users || []);
  };

  socket.on("liveRoomUsers", handleUpdateListeners);

  return () => {
    socket.off("liveRoomUsers", handleUpdateListeners);
  };
}, [socket]);



  // ▶️ Entrar na sala
  const joinRoomListeners = (roomId, user) => {
    if (!roomId || !user) return;
    setCurrentRoomId(roomId);

    const userPayload = {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage,
    };

    const emitEvents = () => {
      socket.emit("joinRoom", { roomId, user: userPayload });

      // socket.off("liveRoomUsers");
      // socket.on("liveRoomUsers", (users) => {
      //   setCurrentUsers(users || []);
      // });
    };

    if (socket?.connected) {
      emitEvents();
    } else {
      socket.once("connect", emitEvents);
    }
  };

  // ⬆️ Emitir joinAsSpeaker
  const emitJoinAsSpeaker = (roomId, user, micState) => {
    console.log("função emitJoinAsSpeaker chamada");
    if (!roomId || !user || !socket) {
      console.log("missing credentials");
      return;
    }

    console.log("emitindo socket joinAsSpeaker...");
    socket.emit("joinAsSpeaker", {
      roomId,
      userId: user._id,
    });
  };

  // 🚪 Emitir saída da sala
  const emitLeaveRoom = (roomId, userId) => {
    if (!roomId || !userId) return;
    socket.emit("userLeavesRoom", { roomId, userId });
    setCurrentRoomId(null);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
  };

  const minimizeRoom = (room, microphoneOn) => {
    if (!room) return;
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
    if (!hasJoinedBefore) setMicOpen(false);
    setHasJoinedBefore(true);
    setMinimizedRoom(room);
  };

  // 🔄 Escutar atualizações de speakers (global)
  useEffect(() => {
    if (!socket) return;

    const handleUpdateSpeakers = (speakers) => {
      console.log("📣 Recebido updateSpeakers:", speakers);
      setCurrentUsersSpeaking(speakers || []);
    };

    socket.on("updateSpeakers", handleUpdateSpeakers);

    return () => {
      socket.off("updateSpeakers", handleUpdateSpeakers);
    };
  }, [socket]);

  // logic for joining a room
  const handleJoinRoom = async (roomId, user, baseUrl) => {
    if (!roomId || !user) return;
    await addCurrentUser(roomId, user, baseUrl); // MongoDB
    joinRoomListeners(roomId, user); // socket.io
  };

  // logic for leaving the room
  const handleLeaveRoom = async (
    roomId,
    user,
    baseUrl,
    leaveChannel,
    navigate
  ) => {
    if (!roomId || !user || !user._id) return;

    console.log("📤 handleLeaveRoom iniciado...");

    // 1️⃣ Emitir saída pelo socket
    emitLeaveRoom(roomId, user._id);

    // 2️⃣ Remover membro da sala no banco
    try {
      await fetch(`${baseUrl}/api/rooms/removeMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          userId: user._id,
        }),
      });
      console.log("✅ Usuário removido do banco");
    } catch (err) {
      console.error("❌ Erro ao remover do banco:", err);
    }

    // 3️⃣ Remover do contexto
    await removeCurrentUser(roomId, user._id, baseUrl);
    await removeSpeaker(roomId, user._id, baseUrl);

    // 4️⃣ Limpar estado e sair da call
    clearMinimizedRoom();
    setHasJoinedBefore(false);

    try {
      await leaveChannel();
      navigate("/");
    } catch (err) {
      console.error("❌ Erro ao sair do canal de voz:", err);
    }
  };

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
        addCurrentUser,
        removeCurrentUser,
        addSpeaker,
        removeSpeaker,
        handleJoinRoom, // ✅ adicionar isso
        handleLeaveRoom, // ✅ e isso
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
