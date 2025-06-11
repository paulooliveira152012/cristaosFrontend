import React, { useState, useEffect, useRef, useContext } from "react";
import { useUser } from "../context/UserContext";
import socket from "../socket"; // Make sure this connects to the correct server
import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../styles/chat.css";
import MicOn from "../assets/icons/microphone/micOn.js";
import MicOff2 from "../assets/icons/microphone/micOff2.js";
import AudioContext from "../context/AudioContext.js";
import SendIcon from "../assets/icons/send.js";

const ChatComponent = ({ roomId }) => {
  const { currentUser } = useUser();
  const { toggleMicrophone, micEnabled } = useContext(AudioContext); // Access the microphone state from AudioContext
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const usernameColors = useRef({});
  const messagesContainerRef = useRef(null); // Reference for the chat container
  const [isAtBottom, setIsAtBottom] = useState(true); // Track if user is at the bottom

  // Monitor socket connection and disconnection events
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const getRandomDarkColor = () => {
    const r = Math.floor(Math.random() * 150);
    const g = Math.floor(Math.random() * 150);
    const b = Math.floor(Math.random() * 150);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isUserAtBottom =
        container.scrollHeight - container.scrollTop === container.clientHeight;
      setIsAtBottom(isUserAtBottom);
    }
  };

  // Scroll to the bottom of the chat container
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Join the room and listen for messages
  useEffect(() => {
    if (roomId) {
      // Join the room-specific chat
      socket.emit("joinRoom", { roomId, user: currentUser });
      console.log("Client joined room:", roomId); // Should log room join

      // Request chat history for this specific room
      socket.emit("requestChatHistory", { roomId });

      // Listen for chat history
      socket.on("chatHistory", (history) => {
        setMessages(history);
        scrollToBottom(false); // Scroll to bottom after loading chat history
      });

      // Listen for new messages
      socket.on("receiveMessage", (newMessage) => {
        console.log("New message received:", newMessage);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      return () => {
        socket.emit("leaveRoomChat", { roomId });
        socket.off("chatHistory");
        socket.off("receiveMessage");
      };
    }
  }, [roomId]);

  // Send message
  const sendMessage = () => {
    if (!currentUser || message.trim() === "") {
      alert("Please log in to send messages");
      return;
    }

    const newMessage = {
      userId: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage, // Add the profile image URL
      message,
      roomId, // Attach the roomId to the message
      timestamp: new Date(), // Add local timestamp
    };

    console.log("Emitting message to the server", newMessage);
    socket.emit("sendMessage", newMessage);

    setMessage(""); // Clear input
    scrollToBottom();
    inputRef.current.focus();
  };

  // Handle message deletion
  const handleDeleteMessage = (messageId) => {
    if (currentUser) {
      socket.emit("deleteMessage", {
        messageId,
        userId: currentUser._id,
        roomId,
      });
    }
  };

  // Listen for message deletion
  useEffect(() => {
    socket.on("messageDeleted", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    return () => {
      socket.off("messageDeleted");
    };
  }, [roomId]);

  // Automatically scroll to the bottom when messages change
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  // Toggle the microphone when the button is clicked
  const handleToggleMicrophone = async () => {
    try {
      await toggleMicrophone(!micEnabled); // Use micEnabled from AudioContext and toggle it
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  return (
    <div className="pageContainer">
      <div
        ref={messagesContainerRef}
        className="chatContainer"
        onScroll={handleScroll}
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
                          backgroundImage: `url(${msg.profileImage || ""})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#ddd",
                          borderRadius: "40%",
                          marginRight: "10px",
                          cursor: "pointer",
                        }}
                      ></div>
                    </Link>
                    {/* name on top of time */}
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
                    onClick={() => handleDeleteMessage(msg._id)}
                    style={{ cursor: "pointer" }}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      
      <div className="inputContainer">
        <div style={{ display: "flex" }}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="input"
            style={{ height: "20px", borderRadius: "30px", marginBottom: "10px" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "10px",
              marginRight: "10px",
            }}
            onClick={sendMessage}
          >
            <SendIcon />
          </div>

          <div
            onClick={handleToggleMicrophone}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "10px",
              marginRight: "10px",
            }}
          >
            {micEnabled ? <MicOn /> : <MicOff2 />} {/* Use micEnabled from AudioContext */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
