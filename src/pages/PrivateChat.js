import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import socket from "../socket";
import "../styles/chat.css";
import { format } from "date-fns";
import Header from "../components/Header";
import {
  handleLeaveDirectMessagingChat,
  handleInviteBackToChat,
  handleFetchRoomMembers,
} from "../components/functions/headerFunctions";

const PrivateChat = () => {
  const { id: conversationId } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef(null);
  const [isOtherUserInChat, setIsOtherUserInChat] = useState(false);
  const [hasOtherUserLeft, setHasOtherUserLeft] = useState(false); // ✅ nova flag

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();


  useEffect(() => {
     if (conversationId && currentUser) {
       handleFetchRoomMembers(conversationId, currentUser, setIsOtherUserInChat);
       console.log("isOtherUserInRoom:", isOtherUserInChat);

     }
  }, [conversationId, currentUser]);

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // fetch messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/messages/${conversationId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };

    // mark chat as read
    const markAsRead = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/dm/markAsRead/${conversationId}`,
          {
            method: "POST",
            credentials: "include",
          }
        );
        socket.emit("privateChatRead", {
          conversationId,
          userId: currentUser._id,
        });
      } catch (error) {
        console.error("Erro ao marcar como lida:", error);
      }
    };

    // Listener fora da função principal
    const handleIncomingMessage = (newMsg) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          const alreadyExists = prev.some((msg) => msg._id === newMsg._id);
          if (!alreadyExists) return [...prev, newMsg];
          return prev;
        });
        console.log("📥 Nova mensagem recebida:", newMsg);
      }
    };

    // 🔐 Registra o listener ANTES de tudo
    socket.off("newPrivateMessage");
    socket.on("newPrivateMessage", handleIncomingMessage);

    if (socket.connected) {
      socket.emit("joinPrivateChat", {
        conversationId,
        userId: currentUser._id,
      });
    } else {
      socket.on("connect", () => {
        socket.emit("joinPrivateChat", {
          conversationId,
          userId: currentUser._id,
        });
      });
    }

    socket.emit("joinPrivateChat", {
      conversationId,
      userId: currentUser._id,
    });

    fetchMessages();
    markAsRead();

    return () => {
      // 🔇 Limpa quando sai do componente
      socket.off("newPrivateMessage", handleIncomingMessage);
    };
  }, [conversationId, currentUser, baseURL, socket]);

  useEffect(() => {
    const handlePresence = ({ conversationId: convId, users }) => {
      if (convId === conversationId) {
        // console.log("📡 Atualização de presença recebida:", users);
        setIsOtherUserInChat(users.length > 0);
      }
    };

    socket.on("currentUsersInPrivateChat", handlePresence);

    return () => {
      socket.off("currentUsersInPrivateChat", handlePresence);
    };
  }, [conversationId, socket]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      conversationId,
      sender: currentUser._id,
      message: message.trim(),
    };

    socket.emit("sendPrivateMessage", msg);
    setMessage("");
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleUserJoined = ({ conversationId: convId, joinedUser }) => {
      if (convId === conversationId) {
        // console.log(`🟢 ${joinedUser.username} entrou na conversa!`);
        setIsOtherUserInChat(true);
        setHasOtherUserLeft(false); // reset caso ele volte
      }
    };

    const handleUserLeft = ({ conversationId: convId, leftUser }) => {
      if (convId === conversationId) {
        console.log(`🔴 ${leftUser.username} saiu da conversa!`);
        setIsOtherUserInChat(false);
        setHasOtherUserLeft(true); // ✅ agora sim!
      }
    };

    socket.on("userJoinedPrivateChat", handleUserJoined);
    socket.on("userLeftPrivateChat", handleUserLeft);

    return () => {
      socket.off("userJoinedPrivateChat", handleUserJoined);
      socket.off("userLeftPrivateChat", handleUserLeft);
    };
  }, [conversationId]);

  return (
    <div className="screenWrapper">
      <Header
        showProfileImage={false}
        navigate={navigate}
        showLeavePrivateRoomButton={true}
        handleLeaveDirectMessagingChat={handleLeaveDirectMessagingChat}
        roomId={conversationId}
      />

      <div className="messagesContainer">
        <div className="chatPageContainer" ref={messagesContainerRef}>
          <div className="messagesContainer">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`messageItem ${msg.system ? "systemMessage" : ""}`}
              >
                {msg.system ? (
                  <em>{msg.message}</em>
                ) : (
                  <>
                    <strong>{msg.username || "Você"}:</strong> {msg.message}
                    <br />
                    <small>
                      {format(new Date(msg.timestamp || new Date()), "PPpp")}
                    </small>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chatPageInputContainer">
        {!isOtherUserInChat ? (
          <button
            className="inviteBackBtn"
            onClick={() =>
              handleInviteBackToChat(conversationId, currentUser._id)
            }
          >
            Convidar usuário de volta
          </button>
        ) : (
          <>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Digite sua mensagem..."
              className="input"
            />
            <button onClick={sendMessage} className="sendBtn">
              Enviar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivateChat;