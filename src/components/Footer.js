// Footer.jsx
import { useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext.js";
import "../styles/components/footer.css";

import MessageIcon from "../assets/icons/messageIcon";
import MessageIconSolid from "../assets/icons/messageIconSolid.js";
import HomeIcon from "../assets/icons/homeIcon";
import HomeIconSolid from "../assets/icons/homeIconSolid";
import PlusIcon from "../assets/icons/plusIcon";
import PlusIconSolid from "../assets/icons/plusIconSolid";
import BellIcon from "../assets/icons/bellIcon";
import BellIconSolid from "../assets/icons/bellIconSolid";
import PlayIcon from "../assets/icons/playIcon.js";
import PlayIconSolid from "../assets/icons/playIconSolid.js";

import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext.js";
import { useUnread } from "../context/UnreadContext.js";

const Footer = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();

  // IDs de notificações já processadas (evita contar 2x)
  const seenIdsRef = useRef(new Set());

  // sino
  const {
    unreadCount,
    setUnreadCount,
    incrementUnread,
    markAllSeen,
  } = useNotification();

  // bolha de mensagens (principal + DMs)
  const { total, increment, reset, setMany, MAIN_ROOM_ID } = useUnread();

  const navigateToMainChat = () => {
    if (currentUser) navigate("/chat");
    else window.alert("Por favor fazer login para acessar o chat principal");
  };

  // 🔔 socket: novas notificações (sino)
  useEffect(() => {
    if (!currentUser || !socket || typeof socket.on !== "function") return;

    const bumpIfMine = (notif) => {
      // só conta se for para este usuário (se o back informa recipient)
      if (notif?.recipient && String(notif.recipient) !== String(currentUser._id)) return;

      // gera um ID estável pra dedupe
      const id = String(
        notif?._id ??
        notif?.id ??
        `${notif?.type || "notif"}:${notif?.conversationId || ""}:${notif?.createdAt || ""}`
      );

      if (id) {
        if (seenIdsRef.current.has(id)) return; // já contamos
        // mantém o Set sob controle
        if (seenIdsRef.current.size > 200) {
          const first = seenIdsRef.current.values().next().value;
          if (first) seenIdsRef.current.delete(first);
        }
        seenIdsRef.current.add(id);
      }

      incrementUnread(1);
    };

    // ⚠️ Evita múltiplos listeners no dev/StrictMode:
    socket.off("newNotification");          // remove TODOS os handlers anteriores desse evento
    socket.on("newNotification", bumpIfMine);

    return () => {
      socket.off("newNotification", bumpIfMine);
    };
  }, [socket, currentUser?._id, incrementUnread]);

  // 🔄 hidratar contagem do sino + contagens dos chats
  useEffect(() => {
    if (!currentUser) return;

    const timeout = setTimeout(async () => {
      const base = process.env.REACT_APP_API_BASE_URL;

      try {
        // 1) contagem via lista (já que você não tem /unreadCount)
        const r = await fetch(`${base}/api/notifications`, { credentials: "include" });
        if (r.ok) {
          const arr = await r.json();
          const count = Array.isArray(arr) ? arr.filter((n) => !n?.isRead).length : 0;
          // não diminui se o socket já somou:
          setUnreadCount((prev) => Math.max(prev, count));
        }
      } catch {
        // silencioso
      }

      try {
        // 2) unread do chat principal + DMs
        const [mainRes, dmRes] = await Promise.all([
          fetch(`${base}/api/users/checkUnreadMainChat`, { credentials: "include" }),
          fetch(`${base}/api/dm/userConversations/${currentUser._id}`, { credentials: "include" }),
        ]);
        const main = mainRes.ok ? await mainRes.json() : { count: 0 };
        const dms = dmRes.ok ? await dmRes.json() : [];
        const entries = [[MAIN_ROOM_ID, Number(main?.count || 0)]];
        for (const c of Array.isArray(dms) ? dms : []) {
          entries.push([String(c._id), Number(c.unreadCount || 0)]);
        }
        setMany(entries);
      } catch {
        // silencioso
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [currentUser, location.pathname, setUnreadCount, setMany, MAIN_ROOM_ID]);

  // 💬 chat principal
  useEffect(() => {
    if (!currentUser || !socket || typeof socket.on !== "function") return;

    const handleNewMessage = ({ roomId }) => {
      const onMain = location.pathname === "/chat";
      if (roomId === MAIN_ROOM_ID && !onMain) increment(MAIN_ROOM_ID, 1);
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, currentUser, location.pathname, increment, MAIN_ROOM_ID]);

  // 📩 DMs
  useEffect(() => {
    if (!currentUser || !socket || typeof socket.on !== "function") return;

    const handleNewPrivateMessage = ({ conversationId }) => {
      const here = location.pathname === `/privateChat/${conversationId}`;
      if (!here) increment(String(conversationId), 1);
    };
    const onPrivateChatRead = ({ conversationId }) => reset(String(conversationId));

    socket.on("newPrivateMessage", handleNewPrivateMessage);
    socket.on("privateChatRead", onPrivateChatRead);

    return () => {
      socket.off("newPrivateMessage", handleNewPrivateMessage);
      socket.off("privateChatRead", onPrivateChatRead);
    };
  }, [socket, currentUser, location.pathname, increment, reset]);

  const openNotifications = () => {
    // zera visual local; a página /notifications deve marcar lidas no servidor
    markAllSeen();
  };

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        {location.pathname === "/" ? <HomeIconSolid className="icon" /> : <HomeIcon className="icon" />}
      </Link>

      <div className="notificationIcon" onClick={navigateToMainChat}>
        {location.pathname === "/chat" ? <MessageIconSolid className="icon" /> : <MessageIcon className="icon" />}
        {total > 0 && <span className="notificationStatus">{total}</span>}
      </div>

      {currentUser && (
        <Link to="/newlisting">
          {location.pathname === "/newlisting" ? <PlusIconSolid className="icon" /> : <PlusIcon className="icon" />}
        </Link>
      )}

      <div className="notificationIcon" onClick={openNotifications}>
        <Link to="/notifications">
          {location.pathname === "/notifications" ? <BellIconSolid className="icon" /> : <BellIcon className="icon" />}
          {unreadCount > 0 && <span className="notificationStatus">{unreadCount}</span>}
        </Link>
      </div>

      <div className="reelsIcon">
        <Link to="/reels">
          {location.pathname === "/reels" ? <PlayIconSolid className="icon" /> : <PlayIcon className="icon" />}
        </Link>
      </div>
    </div>
  );
};

export default Footer;
