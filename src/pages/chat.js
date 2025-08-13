import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "../context/UserContext";
import Header from "../components/Header";
import "../styles/chat.css";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";

function getInitials(name = "Usuário") {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

const Chat = () => {
  const { currentUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [privateChats, setPrivateChats] = useState([]);
  const [unreadMainChatCount, setUnreadMainChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchPrivateChats = useCallback(async () => {
    if (!currentUser?._id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/dm/userConversations/${currentUser._id}`,
        { credentials: "include", headers: { "Cache-Control": "no-cache" } }
      );
      const data = await res.json();
      setPrivateChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar conversas privadas:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?._id) return;
    const handler = (data) => {
      if (data?.userId === currentUser._id) {
        fetchPrivateChats();
      }
    };
    socket.on("privateChatRead", handler);
    return () => socket.off("privateChatRead", handler);
  }, [currentUser?._id, fetchPrivateChats]);

  const checkUnreadMainChat = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;
    fetchPrivateChats();
    checkUnreadMainChat();

    if (location.state?.fromChatList) {
      window.history.replaceState({}, document.title);
    }
  }, [
    currentUser?._id,
    location.state?.fromChatList,
    fetchPrivateChats,
    checkUnreadMainChat,
  ]);

  useEffect(() => {
    if (!currentUser?._id) return;
    const handleNewMainMessage = ({ roomId }) => {
      if (roomId === "mainChatRoom" && location.pathname !== "/mainChat") {
        setUnreadMainChatCount((prev) => prev + 1);
      }
    };
    socket.on("newMessage", handleNewMainMessage);
    return () => socket.off("newMessage", handleNewMainMessage);
  }, [currentUser?._id, location.pathname]);

  const handleNavigateToPrivateChat = async (chatId) => {
    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/dm/markAsRead/${chatId}`,
        { method: "POST", credentials: "include" }
      );
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return privateChats;
    return privateChats.filter((chat) => {
      const otherUser = chat?.participants?.find((p) => p?._id !== currentUser?._id);
      const name = otherUser?.username || "Usuário";
      return name.toLowerCase().includes(q);
    });
  }, [query, privateChats, currentUser?._id]);

  return (
    <div className="chatPage">
      <div className="chatHeaderRow">
        <Header showProfileImage={false} navigate={navigate} />
        <div className="chatHeaderActions">
          <div className="searchBox">
            <input
              type="text"
              placeholder="Buscar conversas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar conversas"
            />
          </div>
        </div>
      </div>

      <div className="chatLayout">
        <aside className="chatSidebar">
          <h3>Suas Conversas</h3>

          <button className="chatItem mainChatItem" onClick={handleNavigateToMainChat}>
            <div className="avatar" aria-hidden="true">
              {/* SVG inline do Heroicons */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                width={20}
                height={20}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64"
                />
              </svg>
            </div>
            <div className="chatMeta">
              <div className="chatTitle">Chat Principal</div>
              <div className="chatSubtitle">Converse com todos</div>
            </div>
            {unreadMainChatCount > 0 && (
              <span className="badge">{unreadMainChatCount}</span>
            )}
          </button>

          <div className="divider" />

          {loading ? (
            <div className="skeletonList">
              <div className="skeletonItem" />
              <div className="skeletonItem" />
              <div className="skeletonItem" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="emptyState">
              {query ? "Nenhuma conversa encontrada." : "Sem conversas ainda."}
            </div>
          ) : (
            <ul className="chatList" role="list">
              {filtered.map((chat) => {
                const otherUser = chat?.participants?.find(
                  (p) => p?._id !== currentUser?._id
                );
                const name = otherUser?.username || "Usuário";
                const initials = getInitials(name);

                return (
                  <li key={chat?._id}>
                    <button
                      className="chatItem"
                      onClick={() => handleNavigateToPrivateChat(chat._id)}
                    >
                      <div className="avatar" aria-hidden="true">{initials}</div>
                      <div className="chatMeta">
                        <div className="chatTitle">{name}</div>
                        <div className="chatSubtitle">
                          {chat?.lastMessage?.text
                            ? chat.lastMessage.text
                            : "Toque para abrir a conversa"}
                        </div>
                      </div>
                      {chat?.unreadCount > 0 && (
                        <span className="badge">{chat.unreadCount}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="chatContentHint">
          <div className="hintCard">
            <h4>Selecione uma conversa</h4>
            <p>
              Toque em um chat ao lado para continuar a conversa. Dica: use a
              busca acima para encontrar alguém rapidamente.
            </p>
            <button className="primaryBtn" onClick={handleNavigateToMainChat}>
              Ir para o Chat Principal
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Chat;
