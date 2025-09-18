import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { useRoom } from "../context/RoomContext.js";
import { useSocket } from "../context/SocketContext";

import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../styles/components/chat.css"; // ⬅️ novo caminho
import MicOn from "../assets/icons/microphone/micOn.js";
import MicOff2 from "../assets/icons/microphone/micOff2.js";
import { useAudio } from "../context/AudioContext.js";
import SendIcon from "../assets/icons/send.js";
import profilePlaceholder from "../assets/images/profileplaceholder.png";
import { useLocation } from "react-router-dom";

import {
  useAutoScrollToBottom,
  getRandomDarkColor,
  handleScrollUtil,
  scrollToBottomUtil,
  handleToggleMicrophoneUtil,
} from "./functions/chatComponentFunctions";

const ChatComponent = ({ roomId }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const { toggleMicrophone, micState } = useAudio();

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const [isAtBottom, setIsAtBottom] = useState(true);

  const {
    room,
    messages,
    newMessage,
    setNewMessage,
    onSendMessage,
    onDeleteMessage,
  } = useRoom();

  // ✅ função estável para rolar ao fim — não muda entre renders
  const scrollToBottom = useCallback(
    () => scrollToBottomUtil(messagesContainerRef),
    []
  );

  useAutoScrollToBottom(messages, isAtBottom, scrollToBottom);

  const onScroll = () => handleScrollUtil(messagesContainerRef, setIsAtBottom);

  const onToggleMic = () =>
    handleToggleMicrophoneUtil({
      toggleMicrophone,
      micState,
      roomId,
      currentUser,
      socket,
    });

  return (
    <div className="chatComponent">
      <div
        ref={messagesContainerRef}
        className="chatScroll"
        onScroll={onScroll}
      >
        <div className="messages">
          {messages.map((msg, index) => {
            if (!usernameColors.current[msg.username]) {
              usernameColors.current[msg.username] = getRandomDarkColor();
            }
            const formattedTime = msg.timestamp
              ? format(new Date(msg.timestamp), "dd-MM-yy h:mm a")
              : "Unknown time";

            const isMine = currentUser && msg.userId === currentUser._id;

            return (
              <div
                key={index}
                className={`messageRow ${isMine ? "mine" : "theirs"}`}
              >
                <Link to={`/profile/${msg.userId}`} className="avatarLink">
                  <div
                    className="chatAvatar"
                    style={{
                      backgroundImage: `url(${
                        msg.profileImage || profilePlaceholder
                      })`,
                    }}
                    title={msg.username}
                  />
                </Link>

                <div className="messageBubble">
                  <div className="messageHeader">
                    <strong
                      className="author"
                      style={{ color: usernameColors.current[msg.username] }}
                      title={msg.username}
                    >
                      {msg.username}
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
                    onClick={() => onDeleteMessage(msg._id)}
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
              onSendMessage();
            }
          }}
          placeholder="Escreva uma mensagem..."
          className="composerInput"
        />

        {room?.isLive && (
          <button
            className="iconBtn"
            onClick={onToggleMic}
            aria-label={micState ? "Desativar microfone" : "Ativar microfone"}
            title={micState ? "Microfone ligado" : "Microfone desligado"}
            style={{
              width: 40,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {micState ? <MicOn /> : <MicOff2 />}
          </button>
        )}

        <button
          className="sendBtn"
          onClick={onSendMessage}
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