import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
import { useLocation } from "react-router-dom";

import {
  EV,
  fetchRoomData,
  startLiveCore,
  fetchMessages,
  sendMessageUtil,
  extractSpeakers,
  isUserSpeaker as isUserSpeakerUtil,
  refreshRoomAction,
  startLiveAction,
  wireChat,
  wireLiveUsers,
  joinRoomListeners,
  emitJoinAsSpeaker,
  emitLeaveRoom,
  handleJoinRoomAction,
  handleLeaveRoomAction,
  sendMessageAction,
  deleteMessageAction,
} from "./functions.js/roomContextFunctions";

const RoomContext = createContext();
export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const location = useLocation()

  const baseUrl =
    process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "";

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [minimizedRoom, setMinimizedRoom] = useState(null);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);
  const [roomReady, setRoomReady] = useState(false);
  const [isRoomLive, setIsRoomLive] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const isUserSpeaker = useCallback(
    (userId) => isUserSpeakerUtil(currentUsersSpeaking, userId),
    [currentUsersSpeaking]
  );
  const isCurrentUserSpeaker = useMemo(
    () => isUserSpeaker(currentUser?._id),
    [isUserSpeaker, currentUser?._id]
  );

  const refreshRoom = useCallback(
    (rid) =>
      refreshRoomAction({
        rid,
        currentRoomId,
        baseUrl,
        currentUser,
        setIsCreator,
        setRoom,
        setCurrentUsersSpeaking,
        setRoomReady,
        setMessages,
      }),
    [currentRoomId, baseUrl, currentUser]
  );

  const startLive = useCallback(
    (args) =>
      startLiveAction({
        ...args,
        baseUrl,
        currentUser,
        setIsRoomLive,
        refreshRoom,
      }),
    [baseUrl, currentUser, refreshRoom]
  );

  // refresh quando a sala muda
  useEffect(() => {
    if (currentRoomId) refreshRoom(currentRoomId);
  }, [currentRoomId, refreshRoom]);

  // listeners de chat (join/history/msg/delete via socket)
  useEffect(() => {
    if (!socket || !currentRoomId || !currentUser?._id) return;
    const off = wireChat({ socket, currentRoomId, currentUser, setMessages });
    return off;
  }, [socket, currentRoomId, currentUser?._id]);

  // listeners de live users + room:live
  useEffect(() => {
    const off = wireLiveUsers({
      socket,
      currentRoomId,
      setCurrentUsers,
      setCurrentUsersSpeaking,
      setRoomReady,
      refreshRoom,
    });
    return off;
  }, [socket, currentRoomId, refreshRoom]);

  // sair automaticamente ao fechar aba
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

  // auto leave se o próprio usuário virar idle
useEffect(() => {
  if (!socket || !currentRoomId) return;
  if (currentUser?.presenceStatus !== "idle") return;

  // sai da sala no back
  socket.emit("leaveLiveRoom", { roomId: currentRoomId });

  // limpa UI local
  setCurrentRoomId(null);
  setCurrentUsers([]);
  setCurrentUsersSpeaking([]);
  setRoomReady(false);
  setRoom(null);
  setIsCreator(false);
}, [socket, currentRoomId, currentUser?.presenceStatus]);


  // helpers de UI
  const minimizeRoom = (room, microphoneOn) => {
    if (!room) return;
    setMinimizedRoom({ ...room, microphoneOn });
    setMicOpen(microphoneOn);
    if (socket?.connected) socket.emit("minimizeUser", { roomId: room._id });
  };

  const clearMinimizedRoom = () => {
    setMinimizedRoom(null);
    setMicOpen(false);
  };

  const leaveRoom = () => {
    if (!minimizedRoom || !currentUser) return;
    emitLeaveRoom({
      socket,
      roomId: minimizedRoom._id,
      resetFns: () => {
        setCurrentRoomId(null);
        setCurrentUsers([]);
        setCurrentUsersSpeaking([]);
        setRoomReady(false);
        setRoom(null);
        setIsCreator(false); // 👈 importante resetar aqui
      },
    });
    clearMinimizedRoom();
    setHasJoinedBefore(false);
  };

  const joinRoom = (room) => {
    if (!room) return;
    if (!hasJoinedBefore) setMicOpen(false);
    setHasJoinedBefore(true);
    setMinimizedRoom(room);
  };

  // Orquestração REST + WS
  const joinRoomListenersWrapped = (roomId, user) =>
    joinRoomListeners({
      socket,
      roomId,
      user,
      setCurrentRoomId,
      setCurrentUsers,
      setCurrentUsersSpeaking,
      setRoomReady,
    });

  const handleJoinRoom = (roomId, user) =>
    handleJoinRoomAction({
      roomId,
      user,
      baseUrl,
      socket,
      setCurrentRoomId,
      setCurrentUsers,
      setCurrentUsersSpeaking,
      setRoomReady,
      currentUser,
    });

  const handleLeaveRoom = (args) =>
    handleLeaveRoomAction({ ...args, socket, onResetUI: () => {
      setCurrentRoomId(null);
      setCurrentUsers([]);
      setCurrentUsersSpeaking([]);
      setRoomReady(false);
      setRoom(null);
      setIsCreator(false); // 👈 importante resetar aqui
    }});

  // ações de chat
  const onSendMessage = useCallback(
    () =>
      sendMessageAction({
        socket,
        currentRoomId,
        currentUser,
        newMessage,
        setMessages,
        setNewMessage,
      }),
    [socket, currentRoomId, currentUser?._id, newMessage]
  );

  const onDeleteMessage = useCallback(
    (messageId) =>
      deleteMessageAction({
        socket,
        roomId: currentRoomId,
        messageId,
        messages,
        setMessages,
      }),
    [socket, currentRoomId, messages]
  );

  if(location.pathname=="/liveRoom") {
    console.log("iscreator?", isCreator)
  }

  // 👇 mantém só quem NÃO está idle
const onlyActive = (u) => u && u.presenceStatus !== "idle";
const currentUsersActive = useMemo(
  () => (currentUsers || []).filter(onlyActive),
  [currentUsers]
);
const currentUsersSpeakingActive = useMemo(
  () => (currentUsersSpeaking || []).filter(onlyActive),
  [currentUsersSpeaking]
);



  return (
    <RoomContext.Provider
      value={{
        room,
        messages,
        setMessages,
        newMessage,
        setNewMessage,
        onSendMessage,
        onDeleteMessage,

        isRoomLive,
        startLive,
        refreshRoom,
        roomReady,
        minimizedRoom,
        micOpen,
        hasJoinedBefore,
        currentRoomId,
        currentUsers: currentUsersActive,
        currentUsersSpeaking: currentUsersSpeakingActive,
        isUserSpeaker,
        isCurrentUserSpeaker,
        setCurrentUsersSpeaking,
        setCurrentUsers,
        minimizeRoom,
        clearMinimizedRoom,
        leaveRoom,
        joinRoom,
        joinRoomListeners: joinRoomListenersWrapped,
        emitLeaveRoom: (roomId) => emitLeaveRoom({
          socket,
          roomId,
          resetFns: () => {
            setCurrentRoomId(null);
            setCurrentUsers([]);
            setCurrentUsersSpeaking([]);
            setRoomReady(false);
            setRoom(null);
            setIsCreator(false); // 👈 importante resetar aqui
          },
        }),
        emitJoinAsSpeaker: (roomId, user) => emitJoinAsSpeaker({ socket, roomId, user }),
        handleJoinRoom,
        handleLeaveRoom,
        isCreator,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};