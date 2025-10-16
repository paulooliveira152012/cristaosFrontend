// RoomContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
    fetchRoomData({
      roomId,
      baseUrl,
      setIsRoomReady,
      setRoom,
      setCanStartRoom,
      setSpeakers,
    });

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
        speakers,
        isLive: !!payload?.isLive,
      }));

      setListeners(currentUsers);
      setSpeakers(speakers);
      setIsRoomReady(true);
    };

    socket.on("liveRoomUsers", onLiveRoomUsers);

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
        await loadRoomMessages({
          roomId,
          baseUrl,
          setMessages,
          setAreMessagesReady,
        });
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
      // if (String(msg.roomId) !== String(roomId)) return;

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
      socket.emit("leaveRoomChat", { roomId });
    };
  }, [socket, roomId, currentUserId, baseUrl, setRoom]);

  // -------------------------- END Useeffect --------------------------

  // RoomContext.jsx (substitua os dois useEffects por este único)
  // useEffect(() => {
  //   console.log("1 useEffect inserindo usuario na sala e buscando dados.");
  //   if (!roomId || !baseUrl || !currentUserId) return;

  //   let alive = true;
  //   setLoadingRoom(true);
  //   setRoomError(null);
  //   setIsRoomReady(false);
  //   setAreMessagesReady(false);
  //   setMessages([]);

  //   (async () => {
  //     try {
  //       // 1) entra na sala via socket antes de qualquer coisa (para não perder eventos)
  //       try {
  //         await new Promise((resolve) => {
  //           if (!socket?.connected) return resolve();
  //           socket.emit("joinRoomChat", { roomId, userId: currentUserId }, () =>
  //             resolve()
  //           );
  //         });
  //       } catch {}

  //       // 2) busca a sala (ideal: endpoint idempotente que já adiciona o usuário)
  //       //    seu fetchRoomData pode continuar como está; se ele já seta estado, ok.
  //       const result = await fetchRoomData({
  //         roomId,
  //         baseUrl,
  //         currentUserId,
  //       });

  //       if (!alive) return;

  //       // compat: se fetchRoomData não seta, usamos o retorno
  //       const roomData = result?.data ?? result ?? null;
  //       if (roomData) {
  //         setRoom(roomData);
  //         setIsRoomReady(true);
  //       }

  //       // 3) carrega mensagens após a sala estar pronta
  //       const msgs = await loadRoomMessages({
  //         roomId,
  //         baseUrl,
  //       });

  //       if (!alive) return;
  //       setMessages(Array.isArray(msgs) ? msgs : []);
  //       setAreMessagesReady(true);
  //     } catch (err) {
  //       if (!alive) return;
  //       console.error("Erro ao preparar sala:", err);
  //       setRoom(null);
  //       setIsRoomReady(false);
  //       setRoomError(err);
  //     } finally {
  //       if (alive) setLoadingRoom(false);
  //     }
  //   })();

  //   // 4) cleanup: sair da sala no socket e impedir setState após unmount
  //   return () => {
  //     alive = false;
  //     try {
  //       if (socket?.connected) {
  //         socket.emit("leaveRoom", { roomId, userId: currentUserId });
  //       }
  //     } catch {}
  //   };
  // }, [roomId, baseUrl, currentUserId, socket]);

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

  // 3) Iniciar Live (wrapper de alto nível para o app)
  const startLive = useCallback(
    async ({ joinChannel, setIsSpeaker, setIsLive } = {}) => {
      // VALIDAÇÕES BÁSICAS
      const baseUrl = process.env.REACT_APP_API_BASE_URL || "";
      if (!baseUrl) {
        console.warn("REACT_APP_API_BASE_URL ausente.");
        return { ok: false, reason: "missing_baseUrl" };
      }
      if (!currentUser?._id) {
        console.warn("Usuário não logado.");
        return { ok: false, reason: "missing_userId" };
      }
      if (!roomId) {
        console.warn("roomId ausente no contexto.");
        return { ok: false, reason: "missing_roomId" };
      }

      const res = await startLiveCore({
        baseUrl,
        currentUser,
        roomId,
        joinChannel,
      });

      if (res.ok) {
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                isLive: true,
                speakers: Array.from(
                  new Set([...(prev.speakers || []), currentUser._id])
                ),
              }
            : prev
        );
        setSpeakers((prev) =>
          Array.from(new Set([...(prev || []), currentUser._id]))
        );
        setIsSpeaker?.(true);
        setIsLive?.(true);
      } else {
        console.warn("Falha ao iniciar live (startLive):", res);
      }

      return res;
    },
    [currentUser, roomId, setRoom]
  );

  // 4 - End/Leave room

  const leaveRoom = useCallback(async () => {
    if (!socket || !roomId) {
      navigate("/");
      return;
    }
    const rid = String(roomId);

    // 1) sair da sala para remover presença
    await new Promise((resolve) => {
      socket.emit("leaveRoomChat", { roomId: rid }, () => resolve());
    });

    // 2) sempre pedir para encerrar; o servidor recusa se não puder
    socket.emit("stopLiveRoom", { roomId: rid }, (ack) => {
      if (ack?.ok) {
        // feedback otimista
        setRoom((prev) =>
          prev ? { ...prev, isLive: false, speakers: [] } : prev
        );
      } else {
        console.warn("stopLiveRoom negado/erro:", ack);
      }
      // 3) navega de qualquer forma
      navigate("/");
    });

    // limpeza local opcional (não obrigatório)
    setMessages([]);
  }, [socket, roomId, navigate, setRoom, setMessages]);

  // -------------------------- END functions --------------------------

  console.log("room:", room);
  // console.log("newMessage:", newMessage);
  // console.log("listeners:", listeners);
  // console.log("speakers:", speakers);

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
        leaveRoom,

        canStartRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
