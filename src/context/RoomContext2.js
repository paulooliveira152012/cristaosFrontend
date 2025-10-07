// RoomContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";
import { useLocation, useParams } from "react-router-dom";

import {
  fetchRoomData,
  isUserSpeaker as isUserSpeakerUtil,
  startLiveAction,
  wireChat,
  wireLiveUsers,
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
  const { roomId: routeRoomId } = useParams();
  const roomId = routeRoomId ?? null; // <- será setado pelo LiveRoomNew

  const { socket } = useSocket();
  const { currentUser } = useUser();
  const location = useLocation();

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

  const currentUserId = currentUser?._id;
  const lastFetchKeyRef = useRef(null);

  const isUserSpeaker = useCallback(
    (userId) => isUserSpeakerUtil(currentUsersSpeaking, userId),
    [currentUsersSpeaking]
  );
  const isCurrentUserSpeaker = useMemo(
    () => isUserSpeaker(currentUser?._id),
    [isUserSpeaker, currentUser?._id]
  );

  // ============================================================
  // 1) Fetch da sala (sempre que roomId + user estiverem prontos)
  // ============================================================

  useEffect(() => {
    if (!roomId || !baseUrl || !currentUserId) return;
    console.log("fetch room!");
    setRoom([]);
    console.log("ANTES room:", room);

    let alive = true;
    (async () => {
      try {
        const result = await fetchRoomData({ roomId, baseUrl, currentUserId });
        if (!alive || !result) return;
        const { data, isCreator } = result;
        console.log("3 --> data da sala mo RooomContext", data);
        setRoom(data);
        setIsCreator(isCreator);
      } catch (err) {
        if (alive) console.error("fetchRoomData error:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, [roomId, baseUrl, currentUserId]);

  // ============================================================
  // 2 fetch currentUsers inroom and set
  // ============================================================
  useEffect(() => {
    console.log("fetching liveUsersInRoom");
    setCurrentUsers([]);
    console.log("currentUsers limpo:", currentUsers);
  }, []);

  // ============================================================
  // 3 add currentUser to currentUsersInRoom
  // ============================================================

  // 2) Efeito ÚNICO: listeners (live+chat) -> join -> gate do roomReady
  useEffect(() => {
    if (!socket || !roomId || !currentUserId) return;

    console.log("refresh!");

    // Reset UI
    setCurrentRoomId(roomId);
    setCurrentUsers([]);
    setCurrentUsersSpeaking([]);
    setMessages([]);
    setRoomReady(false);

    // Gates
    let cancelled = false;
    let gotUsers = false;
    let gotHistory = false;
    const maybeReady = () => {
      if (!cancelled && gotUsers && gotHistory) setRoomReady(true);
    };

    // ---- Live users: wrap para marcar 1ª chegada ----
    let usersReceivedOnce = false;
    const setUsersAndFlag = (list) => {
      setCurrentUsers(list);
      if (!usersReceivedOnce) {
        usersReceivedOnce = true;
        gotUsers = true;
        maybeReady();
      }
    };

    const offLive = wireLiveUsers({
      socket,
      currentRoomId: roomId,
      setCurrentUsers: setUsersAndFlag, // << usa wrapper
      setCurrentUsersSpeaking,
      // passe um stub: o wireLiveUsers vai chamá-lo e nós só marcamos o gate.
      setRoomReady: () => {
        gotUsers = true;
        maybeReady();
      },
    });

    // ---- Chat + histórico: wrap para marcar 1ª chegada ----
    let historyReceivedOnce = false;
    const setMessagesAndFlag = (list) => {
      setMessages(Array.isArray(list) ? list : []);
      if (!historyReceivedOnce) {
        historyReceivedOnce = true;
        gotHistory = true;
        maybeReady();
      }
    };

    const offChat = wireChat({
      socket,
      currentRoomId: roomId,
      currentUser: { _id: currentUserId },
      setMessages: setMessagesAndFlag, // << usa wrapper
    });

    // ---- Fallbacks (se o servidor não emitir nada) ----
    const USERS_TIMEOUT_MS = 2000;
    const HISTORY_TIMEOUT_MS = 2000;

    const usersT = setTimeout(() => {
      if (!gotUsers) {
        console.warn(
          "[RoomContext] Users snapshot não chegou, liberando gate por timeout."
        );
        gotUsers = true;
        maybeReady();
      }
    }, USERS_TIMEOUT_MS);

    const histT = setTimeout(() => {
      if (!gotHistory) {
        console.warn(
          "[RoomContext] Chat history não chegou, liberando gate por timeout."
        );
        gotHistory = true;
        maybeReady();
      }
    }, HISTORY_TIMEOUT_MS);

    // ---- Só agora emite JOIN (listeners prontos) ----
    let didJoin = false;
    const join = () => {
      socket.emit("joinLiveRoom", { roomId, userId: currentUserId });
      didJoin = true;
    };
    if (socket.connected) join();
    else socket.once("connect", join);

    // Cleanup
    return () => {
      cancelled = true;
      clearTimeout(usersT);
      clearTimeout(histT);
      socket.off("connect", join);
      if (socket.connected && didJoin) socket.emit("leaveLiveRoom", { roomId });
      if (typeof offChat === "function") offChat();
      if (typeof offLive === "function") offLive();
    };
  }, [socket, roomId, currentUserId]);

  // 3) Leave ao fechar aba
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     if (socket && currentRoomId && currentUserId) {
  //       socket.emit("leaveLiveRoom", { roomId: currentRoomId });
  //     }
  //   };
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  // }, [socket, currentRoomId, currentUserId]);

  // ===== Ações =====
  const startLive = useCallback(
    (args) => startLiveAction({ ...args, baseUrl, currentUser, setIsRoomLive }),
    [baseUrl, currentUser]
  );

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
        setIsCreator(false);
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
    handleLeaveRoomAction({
      ...args,
      socket,
      onResetUI: () => {
        setCurrentRoomId(null);
        setCurrentUsers([]);
        setCurrentUsersSpeaking([]);
        setRoomReady(false);
        setRoom(null);
        setIsCreator(false);
      },
    });

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
        emitLeaveRoom: (roomId) =>
          emitLeaveRoom({
            socket,
            roomId,
            resetFns: () => {
              setCurrentRoomId(null);
              setCurrentUsers([]);
              setCurrentUsersSpeaking([]);
              setRoomReady(false);
              setRoom(null);
              setIsCreator(false);
            },
          }),
        emitJoinAsSpeaker: (roomId, user) =>
          emitJoinAsSpeaker({ socket, roomId, user }),
        handleJoinRoom,
        handleLeaveRoom,
        isCreator,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
