import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import socket from "../socket"; // Use the globally managed socket
import "../styles/chat.css";
import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

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
} from "../components/functions/chatComponentFunctions";

const MainChat = () => {
  const { currentUser } = useUser(); // Access the logged-in user
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input field
  const usernameColors = useRef({}); // To store unique colors for each username
  const mainChatRoomId = "mainChatRoom"; // Default roomId for the main chat
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  const baseURL = process.env.REACT_APP_API_BASE_URL;
    // utilizando funções importadas
    useSocketConnectionLogger();
  useJoinRoomChat(mainChatRoomId, currentUser, setMessages, () =>
    scrollToBottomUtil(messagesContainerRef)
  );
  useReceiveMessage(setMessages);
  useListenMessageDeleted(mainChatRoomId, setMessages);
  useAutoScrollToBottom(messages, isAtBottom, () =>
    scrollToBottomUtil(messagesContainerRef)
  );

  const sendMessage = () =>
    sendMessageUtil({
      currentUser,
      message,
      roomId: mainChatRoomId,
      socket,
      setMessages,
      setMessage,
      scrollToBottom: () => scrollToBottomUtil(messagesContainerRef),
      inputRef,
    });

  const handleScroll = () =>
    handleScrollUtil(messagesContainerRef, setIsAtBottom);

  const handleDeleteMessage = (messageId) =>
    handleDeleteMessageUtil({
      messageId,
      currentUser,
      socket,
      roomId: mainChatRoomId,
    });

  useEffect(() => {
    socket.on("messageDeleted", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    return () => {
      socket.off("messageDeleted");
    };
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      setTimeout(() => {
        scrollToBottomUtil(messagesContainerRef);
      }, 50);
    }
  }, [messages]);

  // mark main chat as read
  useEffect(() => {
    const markAsRead = async () => {
      await fetch(`${baseURL}/api/users/markMainChatAsRead`, {
        method: "POST",
        credentials: "include",
      });
    };

    markAsRead();
  }, []);

  console.log("messages in chat.js", messages);

  return (
    <div className="screenWrapper">
      <Header showProfileImage={false} navigate={navigate} />
      <div className="messagesContainer">
        <div
          className="chatPageContainer"
          ref={messagesContainerRef} // ✅ CERTO
          onScroll={handleScroll}
        >
          <div className="messagesContainer">
            {messages.map((msg, index) => {
              if (!usernameColors.current[msg.username]) {
                usernameColors.current[msg.username] = getRandomDarkColor();
              }

              // Ensure valid timestamp before formatting
              const formattedTime = msg.timestamp
                ? format(new Date(msg.timestamp), "PPpp")
                : "Unknown time";

              return (
                <div key={index} className="messageItem">
                  <div>
                    {/* profile image */}
                    <Link to={`/profile/${msg.userId}`}>
                      <div
                        style={{
                          backgroundImage: `url(${msg.profileImage || ""})`, // Set the profile image URL
                        }}
                        className="chatMessageProfileImage"
                      ></div>
                    </Link>
                    <strong
                      style={{
                        color: usernameColors.current[msg.username],
                      }}
                    >
                      {msg.username}:
                    </strong>{" "}
                    {msg.message} <br />
                    <small>{formattedTime}</small>
                  </div>
                  {currentUser && msg.userId === currentUser._id && (
                    <TrashIcon
                      onClick={() => handleDeleteMessage(msg._id)}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="chatPageInputContainer">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="input"
        />
        <button onClick={sendMessage} className="sendBtn">
          Send
        </button>
      </div>
    </div>
  );
};

export default MainChat;