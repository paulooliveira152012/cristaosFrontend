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

export const RoomContext = createContext(null);
export const useRoom = () => useContext(RoomContext);

export function RoomProvider({ children }) {
  const { currentUser } = useUser(); // para colocar na sala
  const { socket } = useSocket();
  const currentUserId = currentUser?._id ?? null;

  const [roomId, setRoomId] = useState(null);

  // room
  const [room, setRoom] = useState(null);
  const [userEnteringRoom, setUserEnteringRoom] = useState("");
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [canStartRoom, setCanStartRoom] = useState([]);

  // messages
  const [messages, setMessages] = useState([]);
  const [areMessagesReady, setAreMessagesReady] = useState(false);

  // newMessage
  const [newMessage, setNewMessage] = useState("");

  const baseUrl = process.env.REACT_APP_API_BASE_URL || null;
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

  // 1) listener de presença (liveRoomUsers)
  const onLiveRoomUsers = (payload) => {
    if (!alive) return;
    if (!payload || String(payload.roomId) !== String(roomId)) return;

    setRoom((prev) => ({
      ...(prev || {}),
      _id: roomId,
      currentUsersInRoom: payload.users || [],
      speakers: payload.speakers || [],
      isLive: !!payload.isLive,
    }));
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
      const msgs = await loadRoomMessages({ roomId, baseUrl, setMessages, setAreMessagesReady });
      if (!alive) return;
      const arr = Array.isArray(msgs) ? msgs : (msgs?.messages || []);
      setMessages(arr);
      setAreMessagesReady(true);
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
  // 4) cleanup ao trocar de sala / desmontar
  //==============================================
  return () => {
    alive = false;
    socket.off("liveRoomUsers", onLiveRoomUsers);
    socket.emit("leaveRoomChat", { roomId });
  };
}, [socket, roomId, currentUserId, baseUrl, setRoom]);


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

  // 3) Enviar mensagem (wrapper que injeta setters do contexto)
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

  // 4) delete message util
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

  // Iniciar Live (wrapper de alto nível para o app)
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
        setRoom((prev) => (prev ? { ...prev, isLive: true } : prev));
        // Estados locais (opcionais)
        setIsSpeaker?.(true);
        setIsLive?.(true);
      } else {
        console.warn("Falha ao iniciar live (startLive):", res);
      }

      return res;
    },
    [currentUser, roomId, setRoom]
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
        canStartRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
