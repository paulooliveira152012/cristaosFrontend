import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import { useSocket } from "../context/SocketContext";

// Use the globally managed socket
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const socket = useSocket();
  const { currentUser } = useUser(); // Access the logged-in user
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]); // To store online users
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to the bottom of the chat when a new message is added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
     if (!socket) return;            // 👈 evita .on em null
    // Fetch chat history when the component mounts
    socket.on("chat history", (history) => {
      setMessages(history);
      scrollToBottom();
    });

    // Listen for new messages
    socket.on("receiveMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollToBottom();
    });

    // Listen for online users event
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users); // Update online users state
    });

    // Clean up the event listeners when component unmounts
    return () => {
      socket.off("chat history");
      socket.off("receiveMessage");
      socket.off("onlineUsers");
    };
  }, []);

  const sendMessage = () => {
    if (!currentUser) {
      alert("Por favor log in para mandar mensagens");
      return;
    }

    if (message.trim() === "") return; // Prevent sending empty messages

    const newMessage = {
      userId: currentUser._id,
      username: currentUser.username,
      message,
    };
     
    if (!socket) return;            // 👈 evita .on em null

    socket.emit("sendMessage", newMessage); // Emit the message event
    setMessage(""); // Clear input field after sending
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={styles.pageContainer}>
      <Header navigate={navigate} />
      <div style={styles.onlineUsersContainer}>
        <h3>Online Users</h3>
        <div style={styles.onlineUsersScroll}>
          {onlineUsers.map((user, index) => (
            <div key={index} style={styles.userItem}>
              <img
                src={user.profileImage || "https://via.placeholder.com/50"}
                alt={`${user.username}'s profile`}
                style={styles.userImage}
              />
              <p style={styles.username}>{user.username}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} style={styles.messageItem}>
              <strong style={{ color: "gray" }}>{msg.username}:</strong>{" "}
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown} // Add key down event listener
            placeholder="Type a message..."
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic styles
const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh", // Full viewport height
    paddingBottom: "env(safe-area-inset-bottom)", // Add padding for iOS safe areas
  },
  onlineUsersContainer: {
    padding: "10px",
    backgroundColor: "#f9f9f9",
  },
  onlineUsersScroll: {
    display: "flex",
    overflowX: "auto", // Horizontally scrollable container
    padding: "10px 0",
  },
  userItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginRight: "15px",
    textAlign: "center",
  },
  userImage: {
    width: "50px",
    height: "50px",
    borderRadius: "50%", // Circular profile image
    objectFit: "cover",
  },
  username: {
    marginTop: "5px",
    fontSize: "14px",
    color: "#333",
  },
  chatContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1, // Chat container takes up remaining space
    width: "100%",
  },
  messagesContainer: {
    flex: 1, // This allows the message container to grow and fill the available space
    overflowY: "auto", // Enable vertical scrolling inside the message container
    padding: "10px",
    backgroundColor: "#f1f1f1",
    borderBottom: "1px solid #ddd",
  },
  messageItem: {
    marginBottom: "10px",
    color: "black",
  },
  inputContainer: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#fff",
    // Add bottom padding to account for mobile devices with navigation bars
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingBottom: "15%",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  button: {
    marginLeft: "10px",
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
