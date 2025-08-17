import React, { useState, useEffect, useRef, useContext } from "react";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext";

import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../styles/components/chat.css"; // ⬅️ novo caminho
import MicOn from "../assets/icons/microphone/micOn.js";
import MicOff2 from "../assets/icons/microphone/micOff2.js";
import AudioContext from "../context/AudioContext.js";
import SendIcon from "../assets/icons/send.js";
import profilePlaceholder from "../assets/images/profileplaceholder.png";
import { useLocation } from "react-router-dom";

import {
  useSocketConnectionLogger,
  useJoinRoomChat,
  useReceiveMessage,
  useListenMessageDeleted,
  useAutoScrollToBottom,
  getRandomDarkColor,
  handleScrollUtil,
  scrollToBottomUtil,
  sendMessageUtil,
  handleDeleteMessageUtil,
  handleToggleMicrophoneUtil,
} from "./functions/chatComponentFunctions";

const ChatComponent = ({ roomId }) => {
  const { socket } = useSocket();
  const { currentUser } = useUser();
  const { toggleMicrophone, micState } = useContext(AudioContext);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const [isAtBottom, setIsAtBottom] = useState(true);

  const currentScreen = useLocation();
  console.log("currentScreen:", currentScreen.pathname);

  useSocketConnectionLogger(socket);
  useJoinRoomChat(socket, roomId, currentUser, setMessages, () =>
    scrollToBottomUtil(messagesContainerRef)
  );
  useReceiveMessage(socket, setMessages, roomId);
  useListenMessageDeleted(socket, roomId, setMessages);
  useAutoScrollToBottom(messages, isAtBottom, () =>
    scrollToBottomUtil(messagesContainerRef)
  );

  const onScroll = () => handleScrollUtil(messagesContainerRef, setIsAtBottom);

  const onSendMessage = () =>
    sendMessageUtil({
      currentUser,
      message,
      roomId,
      socket,
      setMessages,
      setMessage,
      scrollToBottom: () => scrollToBottomUtil(messagesContainerRef),
      inputRef,
    });

  const onDeleteMessage = (messageId) =>
    handleDeleteMessageUtil({ messageId, currentUser, socket, roomId });

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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          placeholder="Escreva uma mensagem..."
          className="composerInput"
        />

        {currentScreen.pathname.startsWith("/liveRoom") && (
          <button
            className="iconBtn"
            onClick={onToggleMic}
            aria-label={micState ? "Desativar microfone" : "Ativar microfone"}
            title={micState ? "Microfone ligado" : "Microfone desligado"}
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
