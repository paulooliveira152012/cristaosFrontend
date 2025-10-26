// ChatComponent.jsx — atualizado para novo AudioContext (ensureJoined/startMic/stopMic)
// Alterações principais:
// 1) Remove uso de joinAsSpeaker e toggleMicrophone do AudioContext.
// 2) Passo de 'virar speaker' agora emite diretamente via socket (server define papel).
// 3) Controle local de estado do mic (micOnLocal) usando startMic/stopMic do AudioContext.
// 4) Garante join no canal via ensureJoined antes de ligar o mic.

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "../../../context/UserContext.js";
import { useRoom } from "../../../context/RoomContext.js";
import { useSocket } from "../../../context/SocketContext.js";
import { useAudio } from "../../../context/AudioContext.js";

import TrashIcon from "../../../assets/icons/trashcan.js";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../../../styles/components/chat.css";
import MicOn from "../../../assets/icons/microphone/micOn.js";
import MicOff2 from "../../../assets/icons/microphone/micOff2.js";
import SendIcon from "../../../assets/icons/send.js";
import profilePlaceholder from "../../../assets/images/profileplaceholder.png";

import {
  useAutoScrollToBottom,
  getRandomDarkColor,
  handleScrollUtil,
  scrollToBottomUtil,
  // ⚠️ Se você mantiver esse util, veja versão atualizada no final deste arquivo
  // handleToggleMicrophoneUtil,
} from "../../functions/chatComponentFunctions.js";

// abaixo dos imports de hooks, antes do componente:
const getMessageId = (m) =>
  m?._id || m?.id || m?.messageId || m?.clientMessageId || null;

const ChatComponent = ({ roomId }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();

  // Novo: usamos apenas o necessário do AudioContext
  const {
    ensureJoined,
    startMic,
    stopMic,
    state: rtcState,
    micOnState,
  } = useAudio();

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [micPermission, setMicPermission] = useState(null); // "granted" | "denied" | "prompt" | null

  const {
    room,
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    deleteMessage,
    isCurrentUserSpeaker,
  } = useRoom();

  // acompanha o estado da permissão (Chrome/Edge/Brave; Safari pode retornar null)
  useEffect(() => {
    let watcher;
    (async () => {
      if (!navigator.permissions?.query) return;
      try {
        const status = await navigator.permissions.query({
          name: "microphone",
        });
        setMicPermission(status.state);
        watcher = status;
        status.onchange = () => setMicPermission(status.state);
      } catch {}
    })();
    return () => {
      if (watcher) watcher.onchange = null;
    };
  }, []);

  const askMicPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // se o usuário permitir, o permission API mudará para "granted" e o startMic funcionará
      return true;
    } catch (e) {
      console.warn("getUserMedia negado no askMicPermission:", e);
      return false;
    }
  }, []);

  // função estável para rolar ao fim
  const scrollToBottom = useCallback(
    () => scrollToBottomUtil(messagesContainerRef),
    []
  );
  useAutoScrollToBottom(messages, isAtBottom, scrollToBottom);
  const onScroll = () => handleScrollUtil(messagesContainerRef, setIsAtBottom);

  const ensureRtcReady = useCallback(async () => {
    // Garante que estamos conectados ao canal de voz antes de mexer no mic
    const channel = roomId || room?._id || null;
    const uid = currentUser?._id || null;
    if (!channel || !uid) return false;
    const ok = await ensureJoined(channel, uid);
    return ok;
  }, [ensureJoined, roomId, room?._id, currentUser?._id]);

  const requestJoinAsSpeaker = useCallback(async () => {
    if (!socket?.connected) return;
    // Emite para o servidor que este usuário quer "subir ao palco".
    // Seu backend já deve promover o papel e broadcastar para todos.
    socket.emit("joinAsSpeaker", { roomId, userId: currentUser?._id });
  }, [socket, roomId, currentUser?._id]);

  const onToggleMic = async () => {
    if (!roomId || !currentUser?._id) return;

    // Se ainda não é speaker, solicita promoção primeiro (mic continua OFF por padrão)
    if (!isCurrentUserSpeaker) {
      await requestJoinAsSpeaker();
      // Observação: assumimos que o RoomContext será atualizado via socket do servidor
      // e refletirá isCurrentUserSpeaker = true em seguida.
    }

    // Se o browser indicar "denied", avisa e não tenta ligar
    if (micPermission === "denied") {
      console.warn(
        "⚠️ Permissão de microfone NEGADA. Habilite no cadeado da URL e recarregue."
      );
      // aqui você pode abrir um toast/modal amigável
      return;
    }
    // Se estiver em "prompt", chamamos uma vez para abrir o pop-up
    if (micPermission === "prompt") {
      const ok = await askMicPermission();
      if (!ok) return; // usuário recusou no prompt
      // se permitiu, o status deve mudar para "granted" e seguir abaixo
    }

    // Garante join no canal de voz
    const joined = await ensureRtcReady();
    if (!joined) return;

    // Agora alterna o microfone local
    try {
      if (!micOnState) {
        const ok = await startMic();
        if (!ok) return; // permissão negada, não segue
        socket?.emit?.("micToggled", {
          roomId,
          userId: currentUser._id,
          micOn: true,
        });
      } else {
        await stopMic();
        socket?.emit?.("micToggled", {
          roomId,
          userId: currentUser._id,
          micOn: false,
        });
      }
    } catch (e) {
      console.error("Falha ao alternar microfone:", e);
    }
  };

  const handleSendMessage = () => {
    const text = (newMessage || "").trim();
    if (!socket?.connected || !roomId || !currentUser?._id || !text) return;
    sendMessage({ socket, roomId, currentUser, newMessage: text });
    setNewMessage(""); // limpa input
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket?.connected || !roomId || !messageId) return;
    deleteMessage({ socket, roomId, messageId });
  };

  return (
    <div className="chatComponent">
      <div
        ref={messagesContainerRef}
        className="chatScroll"
        onScroll={onScroll}
      >
        <div className="messages">
          {messages.map((msg, index) => {
            const uname = msg.username || "Usuário"; // ✅ fallback
            if (!usernameColors.current[uname]) {
              usernameColors.current[uname] = getRandomDarkColor();
            }
            const formattedTime = msg.timestamp
              ? format(new Date(msg.timestamp), "dd-MM-yy h:mm a")
              : "Unknown time";

            const isMine = currentUser && msg.userId === currentUser._id;

            return (
              <div
                key={getMessageId(msg) ?? index}
                className={`messageRow ${isMine ? "mine" : "theirs"}`}
              >
                <Link
                  to={msg.userId ? `/profile/${msg.userId}` : "#"}
                  className="avatarLink"
                >
                  <div
                    className="chatAvatar"
                    style={{
                      backgroundImage: `url(${
                        msg.profileImage || profilePlaceholder
                      })`,
                    }}
                    title={uname}
                  />
                </Link>

                <div className="messageBubble">
                  <div className="messageHeader">
                    <strong
                      className="author"
                      style={{ color: usernameColors.current[uname] }}
                      title={uname}
                    >
                      {uname}
                    </strong>
                    <small className="time" aria-label="enviado em">
                      {formattedTime}
                    </small>
                  </div>

                  <div className="messageText">{msg.message}</div>
                </div>

                {isMine && (
                  <button
                    className="iconBtn ghost trashBtn"
                    onClick={() => handleDeleteMessage(getMessageId(msg))}
                    aria-label="Apagar mensagem"
                    title="Apagar"
                    style={{
                      width: 40,
                      height: 40,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      border: "1px solid #2a68d8",
                      borderRadius: "10px",
                    }}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="composer">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Escreva uma mensagem..."
          className="composerInput"
        />

        {room?.isLive && (
          <button
            className="iconBtn"
            onClick={onToggleMic}
            aria-label={micOnState ? "Desativar microfone" : "Ativar microfone"}
            title={micOnState ? "Microfone ligado" : "Microfone desligado"}
            style={{
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {micOnState ? <MicOn /> : <MicOff2 />}
          </button>
        )}

        {room?.isLive && micPermission === "prompt" && (
          <button
            className="iconBtn"
            onClick={askMicPermission}
            title="Conceder acesso ao microfone"
            style={{ marginLeft: 8 }}
          >
            Permitir mic
          </button>
        )}

        <button
          className="sendBtn"
          onClick={handleSendMessage}
          aria-label="Enviar mensagem"
          title="Enviar"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;

/*
=====================================================================
RoomContext patches — currentUsersSpeaking + isCurrentUserSpeaker
---------------------------------------------------------------------
// RoomContext.jsx — adições e alterações pontuais

// 1) ESTADOS NOVOS (perto dos outros useState):
// -------------------------------------------------
const [currentUsersSpeaking, setCurrentUsersSpeaking] = useState([]);

// 2) AJUSTE NO LISTENER PRINCIPAL (liveRoomUsers):
// -------------------------------------------------
const onLiveRoomUsers = (payload) => {
  if (!payload || String(payload.roomId) !== String(roomId)) return;

  const speakers = payload?.speakers ?? [];
  const currentUsers = payload?.users ?? payload?.currentUsersInRoom ?? [];

  setRoom((prev) => ({
    ...(prev || {}),
    _id: roomId,
    currentUsersInRoom: currentUsers,
    speakers, // se você ainda usa prev.speakers noutros lugares
    currentUsersSpeaking: speakers, // mantém no room também (opcional)
    isLive: !!payload?.isLive,
  }));

  setListeners(currentUsers);
  setSpeakers(speakers); // legado
  setCurrentUsersSpeaking(Array.isArray(speakers) ? speakers : []); // ✅ nunca undefined
  setIsRoomReady(true);
};

// 3) NOVOS LISTENERS DE STAGE/SPEAKERS (logo após registrar liveRoomUsers):
// -------------------------------------------------
const onUpdateSpeakers = (payload) => {
  const list = payload?.list;
  setCurrentUsersSpeaking(Array.isArray(list) ? list : []);
};

const onUserJoinsStage = (user) => {
  setCurrentUsersSpeaking((prev) => {
    const id = user?._id || user?.id;
    if (!id) return prev || [];
    const exists = (prev || []).some((u) => (u._id || u.id) === id);
    return exists ? prev : [ ...(prev || []), user ];
  });
};

const onUserLeavesStage = ({ userId }) => {
  setCurrentUsersSpeaking((prev) => (prev || []).filter((u) => (u._id || u.id) !== userId));
};

socket.on("updateSpeakers", onUpdateSpeakers);
socket.on("userJoinsStage", onUserJoinsStage);
socket.on("userLeavesStage", onUserLeavesStage);

// 4) CLEANUP (no return do useEffect):
// -------------------------------------------------
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

// 5) EXPOSE NO PROVIDER (dentro de value):
// -------------------------------------------------
// - isCurrentUserSpeaker: true/false para o usuário atual
// - currentUsersSpeaking: lista completa

// compute simples (sem useMemo):
const isCurrentUserSpeaker = !!currentUsersSpeaking?.some(
  (u) => (u?._id || u?.id) === currentUserId
);

// e então, no value do Provider, adicione:
//   currentUsersSpeaking,
//   isCurrentUserSpeaker,

// 6) OPCIONAL: HELPERS PARA SUBIR/DESCE DO PALCO
// -------------------------------------------------
const addSpeaker = useCallback((user) => {
  socket?.emit("joinAsSpeaker", { roomId, userId: user?._id || currentUserId });
}, [socket, roomId, currentUserId]);

const removeSpeaker = useCallback((userIdParam) => {
  socket?.emit("leaveAsSpeaker", { roomId, userId: userIdParam || currentUserId });
}, [socket, roomId, currentUserId]);

// e exponha no Provider se quiser usar na UI:
//   addSpeaker,
//   removeSpeaker,

// 7) AO ENCERRAR A LIVE, LIMPAR SPEAKERS (ex.: no stopLiveRoom ack):
// -------------------------------------------------
// setRoom((prev) => prev ? { ...prev, isLive: false, speakers: [], currentUsersSpeaking: [] } : prev);
// setCurrentUsersSpeaking([]);

=====================================================================
*/
