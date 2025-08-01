import React, { useState, useEffect, useRef, useContext } from "react";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../styles/chatComponent.css";
import MicOn from "../assets/icons/microphone/micOn.js";
import MicOff2 from "../assets/icons/microphone/micOff2.js";
import AudioContext from "../context/AudioContext.js";
import SendIcon from "../assets/icons/send.js";
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
import profilePlaceholder from "../assets/images/profileplaceholder.png"

const ChatComponent = ({ roomId }) => {
  const { currentUser } = useUser();
  const { toggleMicrophone, micState } = useContext(AudioContext);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useSocketConnectionLogger();
  useJoinRoomChat(roomId, currentUser, setMessages, () =>
    scrollToBottomUtil(messagesContainerRef)
  );
  useReceiveMessage(setMessages);
  useListenMessageDeleted(roomId, setMessages);
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
    <div className="chatContainerWrapper">
      <div
        ref={messagesContainerRef}
        className="chatContainer"
        onScroll={onScroll}
      >
        <div className="messagesContainer">
          {messages.map((msg, index) => {
            if (!usernameColors.current[msg.username]) {
              usernameColors.current[msg.username] = getRandomDarkColor();
            }

            const formattedTime = msg.timestamp
              ? format(new Date(msg.timestamp), "dd-mm-yy h:mm a")
              : "Unknown time";

            return (
              <div key={index} className="messageItem">
                <div className="messageContent">
                  <div className="left">
                    <Link to={`/profile/${msg.userId}`}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundImage: `url(${msg.profileImage || profilePlaceholder})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#ddd",
                          borderRadius: "40%",
                          marginRight: "10px",
                          cursor: "pointer",
                        }}
                      ></div>
                    </Link>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong
                        style={{ color: usernameColors.current[msg.username] }}
                      >
                        {msg.username}:
                      </strong>
                      <small style={{ fontSize: "small", color: "grey" }}>
                        {formattedTime}
                      </small>
                    </div>
                    <div style={{ marginLeft: "10px" }}>{msg.message}</div>
                  </div>
                </div>
                {currentUser && msg.userId === currentUser._id && (
                  <TrashIcon
                    onClick={() => onDeleteMessage(msg._id)}
                    style={{ cursor: "pointer" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="inputContainer">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          placeholder="Type a message..."
          className="input"
          style={{
            height: "20px",
            borderRadius: "30px",
            marginBottom: "10px",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "10px",
            marginRight: "10px",
          }}
          onClick={onSendMessage}
        >
          <SendIcon />
        </div>

        <div
          onClick={onToggleMic}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "10px",
            marginRight: "10px",
          }}
        >
          {micState ? <MicOn /> : <MicOff2 />}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;