// RoomContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  fetchRoomData,
  loadRoomMessages,
  sendMessage as sendMessageUtil,
  deleteMessageAction as deleteMessageUtil,
  startLiveCore,
} from "./functions.js/roomContextFunctions";
import { useUser } from "./UserContext";
import { useSocket } from "./SocketContext";
import { useNavigate } from "react-router-dom";

export const RoomContext = createContext(null);
export const useRoom = () => useContext(RoomContext);

export function RoomProvider({ children }) {
  const { currentUser } = useUser(); // para colocar na sala
  const { socket } = useSocket();
  const currentUserId = currentUser?._id ?? null;
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(null);

  // room
  const [room, setRoom] = useState(null);
  const [userEnteringRoom, setUserEnteringRoom] = useState("");
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [canStartRoom, setCanStartRoom] = useState([]);

  const [listeners, setListeners] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);

  // messages
  const [messages, setMessages] = useState([]);
  const [areMessagesReady, setAreMessagesReady] = useState(false);

  // newMessage
  const [newMessage, setNewMessage] = useState("");

  const baseUrl = process.env.REACT_APP_API_BASE_URL || null;

  // -------------------------- START Useeffect --------------------------

  //==============================================
  // Apenas um useEffect para tudo inicial
  //==============================================
  useEffect(() => {
    if (!socket || !roomId || !currentUserId) return;

    let alive = true;

    // estados de carregamento / reset
    setLoadingRoom(true);
    setRoomError(null);
    setIsRoomReady(false);
    setAreMessagesReady(false);
    // opcional: limpar mensagens ao trocar de sala
    setMessages([]);

    //==============================================
    // 0) fetch room data
    //==============================================
    if (baseUrl) {
      fetchRoomData({
        roomId,
        baseUrl,
        setIsRoomReady,
        setRoom,
        setCanStartRoom,
        setSpeakers,
      });
    } else {
      console.warn("Base URL ausente; pulando fetchRoomData");
    }

    //==============================================
    // 1) listener de presença (liveRoomUsers)
    //==============================================
    const onLiveRoomUsers = (payload) => {
      if (!payload || String(payload.roomId) !== String(roomId)) return;

      const speakers = payload?.speakers ?? [];
      const currentUsers = payload?.users ?? payload?.currentUsersInRoom ?? [];

      setRoom((prev) => ({
        ...(prev || {}),
        _id: roomId,
        currentUsersInRoom: currentUsers,
        speakers, // legado
        currentUsersSpeaking: speakers, // opcional: replica no objeto room
        isLive: !!payload?.isLive,
      }));

      setListeners(currentUsers);
      setSpeakers(speakers); // legado
      setCurrentUsersSpeaking(Array.isArray(speakers) ? speakers : []); // ✅ nunca undefined
      setIsRoomReady(true);
    };

    socket.on("liveRoomUsers", onLiveRoomUsers);

    const onUpdateSpeakers = (payload) => {
      const list = payload?.list;
      if (!Array.isArray(list)) return setCurrentUsersSpeaking([]);
      const uniq = [];
      const seen = new Set();
      for (const u of list) {
        const id = u?._id || u?.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        uniq.push(u);
      }
      setCurrentUsersSpeaking(uniq);
    };

    const onUserJoinsStage = (user) => {
      setCurrentUsersSpeaking((prev) => {
        const id = user?._id || user?.id;
        if (!id) return prev || [];
        const exists = (prev || []).some((u) => (u._id || u.id) === id);
        return exists ? prev : [...(prev || []), user];
      });
    };

    const onUserLeavesStage = ({ userId }) => {
      setCurrentUsersSpeaking((prev) =>
        (prev || []).filter((u) => (u._id || u.id) !== userId)
      );
    };

    socket.on("updateSpeakers", onUpdateSpeakers);
    socket.on("userJoinsStage", onUserJoinsStage);
    socket.on("userLeavesStage", onUserLeavesStage);

    //==============================================
    // 2) entrar na sala (ACK opcional)
    //==============================================
    socket.emit("joinRoomChat", { roomId, currentUserId }, (ack) => {
      if (ack && ack.ok === false) {
        console.warn("joinRoomChat falhou:", ack);
      }
    });

    //==============================================
    // 3) buscar mensagens da sala
    //==============================================
    (async () => {
      try {
        if (baseUrl) {
          await loadRoomMessages({
            roomId,
            baseUrl,
            setMessages,
            setAreMessagesReady,
          });
        } else {
          console.warn("Base URL ausente; pulando loadRoomMessages");
          setAreMessagesReady(true);
        }
      } catch (err) {
        if (!alive) return;
        console.error("Erro ao carregar mensagens:", err);
        setRoomError(err);
        setAreMessagesReady(false);
      } finally {
        if (alive) setLoadingRoom(false);
      }
    })();

    //==============================================
    // 4) novas mensagens em tempo real
    //==============================================
    const onNewRoomMessage = (msg) => {
      if (!alive || !msg) return;
      // se seu servidor emite roomId junto, filtre aqui:
      if (msg.roomId && String(msg.roomId) !== String(roomId)) return;

      setMessages((prev) => {
        // dedupe por _id (Mongo)
        const id = msg?._id && String(msg._id);
        if (id && prev.some((m) => String(m._id) === id)) return prev;
        // append no fim; se quiser ordenar por timestamp, pode ordenar aqui
        return [...prev, msg];
      });
    };

    socket.on("newMessage", onNewRoomMessage); // ou "newPrivateMessage" para DMs

    //==============================================
    // 5) mensagens deletadas
    //==============================================
    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((m) => String(m._id) !== String(messageId))
      );
    };
    socket.on("messageDeleted", onMessageDeleted);

    //==============================================
    // 6) cleanup ao trocar de sala / desmontar
    //==============================================
    return () => {
      alive = false;
      socket.off("liveRoomUsers", onLiveRoomUsers);
      socket.off("newMessage", onNewRoomMessage);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("updateSpeakers", onUpdateSpeakers);
      socket.off("userJoinsStage", onUserJoinsStage);
      socket.off("userLeavesStage", onUserLeavesStage);
      socket.emit("leaveRoomChat", { roomId });
    };
  }, [socket, roomId, currentUserId, baseUrl, setRoom]);

  // -------------------------- END Useeffect --------------------------

  // -------------------------- START functions --------------------------

  // 1) Enviar mensagem (wrapper que injeta setters do contexto)
  const sendMessage = useCallback(
    async ({ socket, roomId, currentUser, newMessage }) => {
      return sendMessageUtil({
        socket,
        roomId,
        currentUser,
        newMessage,
        setMessages, // vem do estado do contexto
        setNewMessage, // vem do estado do contexto
      });
    },
    [setMessages, setNewMessage]
  );

  // 2) delete message util
  // Deletar mensagem (injeta setMessages; pode passar eventName se for diferente)
  const deleteMessage = useCallback(
    async ({ socket, roomId, messageId, eventName }) => {
      return deleteMessageUtil({
        socket,
        roomId,
        messageId,
        setMessages,
        eventName, // opcional: "deletePrivateMessage" por padrão
      });
    },
    [setMessages]
  );

  // 3) Iniciar Live (APENAS metadados/estado - sem tocar no Agora aqui)
  const startLive = useCallback(async () => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || "";
    if (!baseUrl) return { ok: false, reason: "missing_baseUrl" };
    if (!currentUser?._id) return { ok: false, reason: "missing_userId" };
    if (!roomId) return { ok: false, reason: "missing_roomId" };

    const res = await startLiveCore({ baseUrl, currentUser, roomId });
    if (res?.ok) {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              isLive: true,
              speakers: [
                ...(prev.speakers || []),
                {
                  _id: currentUser._id,
                  username: currentUser.username,
                  profileImage: currentUser.profileImage,
                },
              ],

              currentUsersSpeaking: [
                ...((prev.currentUsersSpeaking ?? prev.speakers) || []),
                {
                  _id: currentUser._id,
                  username: currentUser.username,
                  profileImage: currentUser.profileImage,
                },
              ],
            }
          : prev
      );

      setCurrentUsersSpeaking((prev) => [
        ...(prev || []),
        {
          _id: currentUser._id,
          username: currentUser.username,
          profileImage: currentUser.profileImage,
        },
      ]);
    } else {
      console.warn("Falha ao iniciar live (startLive):", res);
    }
    return res;
  }, [currentUser, roomId, setRoom]);

  // Deixe o “flow” de áudio para a UI (AudioContext).
  // Se quiser manter um “atalho”, faça só a parte de metadados aqui:
  const startLiveFlow = useCallback(
    async (rid) => {
      const useRid = rid || roomId;
      if (!useRid) throw new Error("missing roomId");
      // Aqui não chamamos Agora; a tela deve ligar o mic via AudioContext.startMic()
      return startLive();
    },
    [roomId, startLive]
  );

  // 4 - End/Leave room

  const leaveRoom = useCallback(async () => {
    if (!socket || !roomId) {
      navigate("/");
      return;
    }
    const rid = String(roomId);

    await new Promise((resolve) => {
      socket.emit("leaveRoomChat", { roomId: rid }, () => resolve());
    });

    socket.emit("stopLiveRoom", { roomId: rid }, (ack) => {
      if (ack?.ok) {
        setRoom((prev) =>
          prev
            ? { ...prev, isLive: false, speakers: [], currentUsersSpeaking: [] }
            : prev
        );
        setCurrentUsersSpeaking([]);
      } else {
        console.warn("stopLiveRoom negado/erro:", ack);
      }
      navigate("/");
    });

    setMessages([]);
  }, [socket, roomId, navigate, setRoom, setMessages]);

  // -------------------------- END functions --------------------------

  // console.log("room no roomContext:", room);
  // console.log("newMessage:", newMessage);
  // console.log("listeners:", listeners);
  // console.log("speakers:", speakers);
  // console.log("canStartRoom:", canStartRoom);

  const isCurrentUserSpeaker = !!currentUsersSpeaking?.some(
    (u) => (u?._id || u?.id) === currentUserId
  );

  const addSpeaker = useCallback(
    (user) =>
      socket?.emit("joinAsSpeaker", {
        roomId,
        userId: user?._id || currentUserId,
      }),
    [socket, roomId, currentUserId]
  );
  const removeSpeaker = useCallback(
    (userIdParam) =>
      socket?.emit("leaveAsSpeaker", {
        roomId,
        userId: userIdParam || currentUserId,
      }),
    [socket, roomId, currentUserId]
  );

  return (
    <RoomContext.Provider
      value={{
        // ids
        roomId,
        setRoomId,

        // room
        room,
        setRoom,
        isRoomReady,
        loadingRoom,
        roomError,
        setUserEnteringRoom,

        // messages
        messages,
        setMessages,
        areMessagesReady,

        // message
        newMessage,
        setNewMessage,

        // ações
        sendMessage,
        deleteMessage,
        startLive,
        startLiveFlow,

        leaveRoom,

        canStartRoom,
        currentUsersSpeaking,
        isCurrentUserSpeaker,
        addSpeaker,
        removeSpeaker,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
