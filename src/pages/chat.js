import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import socket from "../socket"; // Use the globally managed socket
import "../styles/chat.css";
import TrashIcon from "../assets/icons/trashcan";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { currentUser } = useUser(); // Access the logged-in user
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input field
  const usernameColors = useRef({}); // To store unique colors for each username
  const mainChatRoomId = "mainChatRoom"; // Default roomId for the main chat
  const navigate = useNavigate()

  // Generate random dark colors
  const getRandomDarkColor = () => {
    const r = Math.floor(Math.random() * 150); // Limit to darker shades
    const g = Math.floor(Math.random() * 150);
    const b = Math.floor(Math.random() * 150);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Scroll to the bottom of the chat
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Join room and listen to messages and chat history
  useEffect(() => {
    if (mainChatRoomId) {
      // Join the main chat room
      socket.emit("joinRoom", { roomId: mainChatRoomId, user: currentUser });
      console.log("✅✅✅")
      console.log("user:", currentUser)
      console.log(`Joined room: ${mainChatRoomId}`)
      // console.log(`Joined room: ${mainChatRoomId} with user: ${currentUser.username}`);

      // Request chat history for the main chat room
      socket.emit("requestChatHistory", { roomId: mainChatRoomId });

      // Listen for chat history
      socket.on("chatHistory", (history) => {
        setMessages(history);
        scrollToBottom(false); // Scroll to bottom immediately after loading chat history
      });

      // Listen for new messages
      socket.on("receiveMessage", (newMessage) => {
        console.log("Message received from backend:", newMessage);

        if (newMessage.roomId === mainChatRoomId) {
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          scrollToBottom();
        }
      });

      // Clean up when leaving the room
      return () => {
        socket.emit("leaveRoom", { roomId: mainChatRoomId });
        socket.off("chatHistory");
        socket.off("receiveMessage");
      };
    }
  }, [mainChatRoomId, currentUser]);

  const sendMessage = () => {
    if (!currentUser) {
      alert("Please log in to send messages");
      return;
    }

    if (message.trim() === "") return;

    const newMessage = {
      userId: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage, // Correct field name
      message,
      roomId: mainChatRoomId, // Attach the main chat roomId to the message
      timestamp: new Date() // Add local timestamp 
    };

    console.log("Sending message:", newMessage); // Log the message being sent

    // Emit the message to the server
    socket.emit("sendMessage", newMessage);

    // Optimistically update the local messages state
    // setMessages((prevMessages) => [...prevMessages, newMessage]);

    setMessage(""); // Clear input
    scrollToBottom();
    inputRef.current.focus();
  };

  const handleDeleteMessage = (messageId) => {
    if (currentUser) {
      socket.emit("deleteMessage", {
        messageId,
        userId: currentUser._id,
        roomId: mainChatRoomId, // Pass the main chat roomId when deleting a message
      });
    }
  };

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

  console.log("messages in chat.js", messages);

  return (
    <div style={styles.pageContainer}>
      <Header 
        showProfileImage={false} 
        navigate={navigate}
      />
      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => {
            if (!usernameColors.current[msg.username]) {
              usernameColors.current[msg.username] = getRandomDarkColor();
            }

            // Ensure valid timestamp before formatting
            const formattedTime = msg.timestamp
              ? format(new Date(msg.timestamp), "PPpp")
              : "Unknown time";

            return (
              <div key={index} style={styles.messageItem}>
                <div>
                  {/* profile image */}
                  <Link to={`/profile/${msg.userId}`}>
                    <div
                      style={{
                        width: "40px", // Adjust size as needed
                        height: "40px", // Adjust size as needed
                        backgroundImage: `url(${msg.profileImage || ""})`, // Set the profile image URL
                        backgroundSize: "cover", // Ensure the image covers the entire div
                        backgroundPosition: "center", // Center the image within the div
                        backgroundColor: "#ddd", // Fallback background color
                        borderRadius: "50%", // Make it a circle
                        marginRight: "10px", // Add some spacing if needed
                      }}
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
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button 
          onClick={sendMessage} 
          style={styles.button}>
          Send
        </button>
      </div>
    </div>
  );
};

// Basic styles
const styles = {
  pageContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingBottom: "env(safe-area-inset-bottom)", // Add padding for iOS safe areas
  },
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflowY: "auto",
    backgroundColor: "white",
    height: "75vh",
    marginBottom: "200px",
  },
  messagesContainer: {
    padding: "10px",
    paddingBottom: "70px",
  },
  messageItem: {
    marginBottom: "10px",
    color: "black",
    display: "flex",
    justifyContent: "space-between",
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    backgroundColor: "#fff",
    position: "fixed",
    bottom: 0,
    width: "100%",
    height: "15vh",
    paddingBottom: "env(safe-area-inset-bottom)", // Safe area for mobile devices
    maxWidth: "800px",
    paddingBottom: "20px",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Chat;
