import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import "../styles/chat.css";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";

const Chat = () => {
  const { currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [privateChats, setPrivateChats] = useState([]);
  const [unreadMainChatCount, setUnreadMainChatCount] = useState(0);



  const fetchPrivateChats = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/dm/userConversations/${currentUser._id}`,
        {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache", // força pegar do servidor
          },
        }
      );
      const data = await res.json();
      console.log("👀 privateChats:", data); // aqui
      setPrivateChats(data);
    } catch (err) {
      console.error("Erro ao buscar conversas privadas:", err);
    }
  }, [currentUser]);

    useEffect(() => {
    socket.on("privateChatRead", (data) => {
      if (data?.userId === currentUser?._id) {
        fetchPrivateChats(); // atualiza os contadores
      }
    });

    return () => {
      socket.off("privateChatRead");
    };
  }, [currentUser, fetchPrivateChats]);

  const checkUnreadMainChat = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/checkUnreadMainChat`,
        { credentials: "include" }
      );
      const data = await res.json();
      setUnreadMainChatCount(data?.count || 0);
    } catch (err) {
      console.error(
        "Erro ao verificar mensagens não lidas no chat principal:",
        err
      );
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    fetchPrivateChats();
    checkUnreadMainChat();

    // limpa o state do histórico para não refazer no próximo render
    if (location.state?.fromChatList) {
      window.history.replaceState({}, document.title);
    }
  }, [
    currentUser,
    location.state?.fromChatList,
    fetchPrivateChats,
    checkUnreadMainChat,
  ]);

  const handleNavigateToPrivateChat = async (chatId) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/dm/markAsRead/${chatId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      // força o update imediato antes de sair
      await fetchPrivateChats();

      navigate(`/privateChat/${chatId}`, { state: { fromChatList: true } });
    } catch (err) {
      console.error("Erro ao marcar como lida antes de navegar:", err);
      navigate(`/privateChat/${chatId}`);
    }
  };

  const handleNavigateToMainChat = () => {
    setUnreadMainChatCount(0);
    navigate("/mainChat");
  };

  useEffect(() => {
  if (!currentUser) return;

  const handleNewMainMessage = ({ roomId }) => {
    // Se for para o mainChatRoom e o usuário não estiver nele agora...
    if (roomId === "mainChatRoom" && location.pathname !== "/mainChat") {
      setUnreadMainChatCount((prev) => prev + 1);
    }
  };

  socket.on("newMessage", handleNewMainMessage);

  return () => {
    socket.off("newMessage", handleNewMainMessage);
  };
}, [currentUser, location.pathname]);


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
