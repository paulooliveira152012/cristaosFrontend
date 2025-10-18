import React, { useState, useRef, useCallback } from "react";
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
  handleToggleMicrophoneUtil,
} from "../../functions/chatComponentFunctions.js";

// abaixo dos imports de hooks, antes do componente:
const getMessageId = (m) =>
  m?._id || m?.id || m?.messageId || m?.clientMessageId || null;

const ChatComponent = ({ roomId }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  // ✅ só o que você usa do AudioContext
  const { toggleMicrophone, micOn, joinAsSpeaker} = useAudio();

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const [isAtBottom, setIsAtBottom] = useState(true);

  const {
    room,
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    deleteMessage,
    isCurrentUserSpeaker,
  } = useRoom();

  // função estável para rolar ao fim
  const scrollToBottom = useCallback(
    () => scrollToBottomUtil(messagesContainerRef),
    []
  );
  useAutoScrollToBottom(messages, isAtBottom, scrollToBottom);
  const onScroll = () => handleScrollUtil(messagesContainerRef, setIsAtBottom);

   const onToggleMic = async () => {
  if (!roomId || !currentUser?._id) return;
  // 1) Se não for speaker ainda, vira speaker (mic continua OFF por padrão)
  if (!isCurrentUserSpeaker) {
    await joinAsSpeaker({ roomId }); // só seta papel no servidor
  }
  // 2) Agora sim, alterna o mic (liga/desliga local + emite socket no AudioContext)
  await handleToggleMicrophoneUtil({
    toggleMicrophone,
    micState: micOn,
    roomId,
  });
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
                  to={msg.userId ? `/profile/${msg.userId}` : "#"} // ✅ evita link quebrado
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
            aria-label={micOn ? "Desativar microfone" : "Ativar microfone"}
            title={micOn ? "Microfone ligado" : "Microfone desligado"}
            style={{
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {micOn ? <MicOn /> : <MicOff2 />}
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
