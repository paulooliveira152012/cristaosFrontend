import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import socket from "../socket"; // Make sure this connects to the correct server
import SimplePeer from "simple-peer";
import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import "../styles/chat.css";

const ChatComponent = ({ roomId }) => {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLive, setIsLive] = useState(false); // Flag for live chat
  const [isMicOn, setIsMicOn] = useState(false); // Flag for microphone
  const [peer, setPeer] = useState(null);
  const audioRef = useRef(null); // For microphone audio stream
  const peerRef = useRef([]); // To keep track of multiple peers
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

    // Listen for live voice session status
    socket.on("liveSessionStatus", (status) => {
      setIsLive(status);
    });

    // Listen for WebRTC signaling
    socket.on("signal", (data) => {
      if (peer) {
        peer.signal(data.signal);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("liveSessionStatus");
      socket.off("signal");
    };
  }, [peer]);

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

    // Optimistically update the local messages state
    // setMessages((prevMessages) => [...prevMessages, newMessage]);

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

  return (
    <div className="pageContainer">
      {!isLive && (
        <button onClick={() => setIsLive(true)} className="liveButton">
          Start Live Voice Chat
        </button>
      )}

      {isLive && (
        <button onClick={() => setIsMicOn(!isMicOn)} className="micButton">
          {isMicOn ? "Turn Off Microphone" : "Turn On Microphone"}
        </button>
      )}

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
              ? format(new Date(msg.timestamp), "PPpp")
              : "Unknown time";

            return (
              <div key={index} className="messageItem">
                <div className="messageContent">
                  <div>
                    <Link to={`/profile/${msg.userId}`}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundImage: `url(${msg.profileImage || ""})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundColor: "#ddd",
                          borderRadius: "50%",
                          marginRight: "10px",
                          cursor: "pointer",
                        }}
                      ></div>
                    </Link>
                    <strong style={{ color: usernameColors.current[msg.username] }}>
                      {msg.username}:
                    </strong>
                    <div style={{ marginLeft: "10px" }}>{msg.message}</div>
                    <small>{formattedTime}</small>
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
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="input"
        />
        <button onClick={sendMessage} className="button">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;


// Me regrar com tudo (disciplina)
// - nao pegar celular quando acordar
// faewr coisas que nao quero mas asao necessarias (intertacao social)

// voluntariar para interagir com pessoas um momento por semana
//  falar com a gabi para semana que vem nos dois passar na cessao psicologo
