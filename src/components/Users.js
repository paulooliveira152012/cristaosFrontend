import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import { useSocket } from "../context/SocketContext";
import profilePlaceHolder from "../assets/images/profileplaceholder.png";
import { useNavigate } from "react-router-dom";

const MAIN_ROOM_ID = "mainChatRoom";

const Chat = () => {
  const { socket } = useSocket(); // ✅ desestruturado
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // histórico + novas mensagens
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    // pedir histórico do main chat
    socket.emit("requestChatHistory", { roomId: MAIN_ROOM_ID });

    const onHistory = (history) => {
      setMessages(Array.isArray(history) ? history : []);
      scrollToBottom();
    };

    const onNewMessage = (msg) => {
      // garanta que é do main chat
      if (msg?.roomId !== MAIN_ROOM_ID) return;
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };

    socket.on("chatHistory", onHistory);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("chatHistory", onHistory);
      socket.off("newMessage", onNewMessage);
    };
  }, [socket]);

  // usuários online (opcional)
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const onOnline = (users) =>
      setOnlineUsers(Array.isArray(users) ? users : []);
    socket.on("onlineUsers", onOnline);

    return () => socket.off("onlineUsers", onOnline);
  }, [socket]);

  const sendMessage = () => {
    if (!currentUser) {
      alert("Por favor logue para mandar mensagens");
      return;
    }
    if (!message.trim()) return;
    if (!socket || typeof socket.emit !== "function") return;

    const newMessage = {
      userId: currentUser._id,
      username: currentUser.username,
      profileImage: currentUser.profileImage || "",
      message,
      roomId: MAIN_ROOM_ID, // ✅ importante
      timestamp: new Date(),
    };

    socket.emit("sendMessage", newMessage);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.pageContainer}>
      <Header navigate={navigate} />

      <div style={styles.onlineUsersContainer}>
        <h3>Online Users</h3>
        <div style={styles.onlineUsersScroll}>
          {onlineUsers.map((user, index) => (
            <div
              key={`${user.userId || user._id || index}`}
              style={styles.userItem}
            >
              <img
                src={user.profileImage || profilePlaceHolder}
                alt={`${user.username || "Usuário"} profile`}
                style={styles.userImage}
              />
              <p style={styles.username}>{user.username || "Usuário"}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.chatContainer}>
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={msg._id || index} style={styles.messageItem}>
              <strong style={{ color: "gray" }}>{msg.username}:</strong>{" "}
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
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

// estilos básicos
const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  onlineUsersContainer: {
    padding: "10px",
    backgroundColor: "#f9f9f9",
  },
  onlineUsersScroll: {
    display: "flex",
    overflowX: "auto",
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
    borderRadius: "50%",
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
    flex: 1,
    width: "100%",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
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
    paddingBottom: "env(safe-area-inset-bottom)",
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
