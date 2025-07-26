import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import "../styles/chat.css";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [privateChats, setPrivateChats] = useState([]);
  const [unreadMainChatCount, setUnreadMainChatCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPrivateChats = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/dm/userConversations/${currentUser._id}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setPrivateChats(data);
      } catch (err) {
        console.error("Erro ao buscar conversas privadas:", err);
      }
    };

    const checkUnreadMainChat = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/checkUnreadMainChat`,
          { credentials: "include" }
        );
        const data = await res.json();
        setUnreadMainChatCount(data?.count || 0);
      } catch (err) {
        console.error("Erro ao verificar mensagens não lidas no chat principal:", err);
      }
    };

    fetchPrivateChats();
    checkUnreadMainChat();
  }, [currentUser]);

  const handleNavigateToPrivateChat = (chatId) => {
    setPrivateChats((prev) =>
      prev.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
    navigate(`/privateChat/${chatId}`);
  };

  const handleNavigateToMainChat = () => {
    setUnreadMainChatCount(0);
    navigate("/mainChat");
  };

  return (
    <div className="chatPageWrapper">
      <Header showProfileImage={false} navigate={navigate} />

      <div className="chatSidebar">
        <h3>Suas Conversas</h3>
        <ul>
          <li
            onClick={handleNavigateToMainChat}
            className="chatPreview notificationIcon"
          >
            💬 Chat Principal
            {unreadMainChatCount > 0 && (
              <span className="notificationIconChatPage">
                {unreadMainChatCount}
              </span>
            )}
          </li>

          {privateChats.map((chat) => {
            const otherUser = chat.participants.find(
              (p) => p._id !== currentUser._id
            );

            return (
              <li
                key={chat._id}
                onClick={() => handleNavigateToPrivateChat(chat._id)}
                className="chatPreview"
              >
                Conversa com: {otherUser?.username || "Usuário"}
                {chat.unreadCount > 0 && (
                  <span className="notificationIconChatPage">
                    {chat.unreadCount}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Chat;
