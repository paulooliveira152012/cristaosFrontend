// RoomContext.jsx
import {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { 
  fetchRoomData, 
  loadRoomMessages,
  sendMessage as sendMessageUtil,
  deleteMessageAction as deleteMessageUtil,
  startLiveCore
} from "./functions.js/roomContextFunctions";
import { useUser } from "./UserContext";
import { useSocket } from "./SocketContext";

export const RoomContext = createContext(null);
export const useRoom = () => useContext(RoomContext);

export function RoomProvider({ children }) {
  const { currentUser } = useUser();
  const { socket } = useSocket()
  const currentUserId = currentUser?._id ?? null;

  const [roomId, setRoomId] = useState(null);

  // room
  const [room, setRoom] = useState(null);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [roomError, setRoomError] = useState(null);
  const [canStartRoom, setCanStartRoom] = useState([])

  // messages
  const [messages, setMessages] = useState([]);
  const [areMessagesReady, setAreMessagesReady] = useState(false);

  // newMessage
  const [newMessage, setNewMessage] = useState("")

  const baseUrl = process.env.REACT_APP_API_BASE_URL || null;

  // Reset quando trocar de roomId
  useEffect(() => {
    setRoom(null);
    setIsRoomReady(false);
    setLoadingRoom(false);
    setRoomError(null);
    setMessages([]);
    setAreMessagesReady(false);
    setNewMessage("");
  }, [roomId]);

  // 1) Buscar e setar room
  useEffect(() => {
    if (!roomId || !baseUrl || !currentUserId) return;

    let cancelled = false;
    setLoadingRoom(true);
    setRoomError(null);

    (async () => {
      try {
        console.log("1 - chamando fetchRoomData", { roomId });
        // sua função já aceita setters; se preferir, pode retornar { data } e setar aqui
        const result = await fetchRoomData({
          roomId,
          baseUrl,
          currentUserId,
          // se sua função usar esses callbacks, ok; senão, remova e use o retorno:
          setIsRoomReady,
          setRoom,
          setCanStartRoom,
        });

        // Caso fetchRoomData retorne { data }, mantenha compatibilidade:
        if (!cancelled && result?.data && typeof setRoom === "function") {
          setRoom(result.data);
          setIsRoomReady(true);
        }
      } catch (err) {
        console.error("Erro ao carregar sala:", err);
        if (!cancelled) {
          setRoom(null);
          setIsRoomReady(false);
          setRoomError(err);
        }
      } finally {
        if (!cancelled) setLoadingRoom(false);
      }
    })();

    return () => { cancelled = true; };
  }, [roomId, baseUrl, currentUserId]);

  // 2) Buscar mensagens quando a room estiver pronta
  useEffect(() => {
    const rid = room?._id;
    if (!rid || !baseUrl) {
      // null-safe log
      console.log("Aguardando room/baseUrl para carregar mensagens:", { rid, baseUrl });
      return;
    }

    let cancelled = false;
    setAreMessagesReady(false);

    (async () => {
      try {
        console.log("3 - chamando loadRoomMessages", { rid });
        // Se sua função já chama os setters, passe-os; senão, capture retorno e set aqui.
        const maybeMsgs = await loadRoomMessages({
          roomId: rid,
          baseUrl,
          setMessages: (msgs) => { if (!cancelled) setMessages(msgs); },
          setAreMessagesReady: (flag) => { if (!cancelled) setAreMessagesReady(flag); },
        });

        if (!cancelled && Array.isArray(maybeMsgs)) {
          setMessages(maybeMsgs);
          setAreMessagesReady(true);
        }
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
        if (!cancelled) setAreMessagesReady(false);
      }
    })();

    return () => { cancelled = true; };
  }, [room?._id, baseUrl]);

  // 3) Enviar mensagem (wrapper que injeta setters do contexto)
const sendMessage = useCallback(async ({ socket, roomId, currentUser, newMessage }) => {
  return sendMessageUtil({
    socket,
    roomId,
    currentUser,
    newMessage,
    setMessages,    // vem do estado do contexto
    setNewMessage,  // vem do estado do contexto
  });
}, [setMessages, setNewMessage]);

// 4) delete message util
// Deletar mensagem (injeta setMessages; pode passar eventName se for diferente)
const deleteMessage = useCallback(async ({ socket, roomId, messageId, eventName }) => {
  return deleteMessageUtil({
    socket,
    roomId,
    messageId,
    setMessages,
    eventName, // opcional: "deletePrivateMessage" por padrão
  });
}, [setMessages]);


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







  // Logs úteis sem causar stale:
  useEffect(() => {
    if (room?._id) console.log("Room pronta:", room._id);
  }, [room?._id]);

  useEffect(() => {
    if (areMessagesReady) console.log("Mensagens carregadas:", messages.length);
  }, [areMessagesReady, messages.length]);

  useEffect(() => {
  console.log("canStartRoom atualizado:", canStartRoom);
}, [canStartRoom]);



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
        canStartRoom   
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}