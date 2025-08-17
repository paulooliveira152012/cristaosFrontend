import { useEffect } from "react";
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

import { checkForNewNotifications } from "./functions/footerFunctions";
import { useUser } from "../context/UserContext";
import { useSocket } from "../context/SocketContext.js";
import { useUnread } from "../context/UnreadContext.js";

const Footer = () => {
  const { socket } = useSocket(); // ✅ desestruturado
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
  const { notifications, setNotifications } = useNotification();
  const { total, increment, reset, setMany, MAIN_ROOM_ID } = useUnread();

  const navigateToMainChat = () => {
    if (currentUser) navigate("/chat");
    else window.alert("Por favor fazer login para acessar o chat principal");
  };

  // 🔔 notificações em tempo real
  useEffect(() => {
    if (!currentUser) return;
    if (!socket || typeof socket.on !== "function") return;

    const handleNewNotification = () => setNotifications(true);

    // use o nome que seu back emite; deixo os dois por compat:
    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, currentUser, setNotifications]);

  // 🔄 hidratar contagens (main + DMs) ao trocar de rota / montar
  useEffect(() => {
    if (!currentUser) return;
    const timeout = setTimeout(() => {
      checkForNewNotifications(setNotifications);
      (async () => {
        try {
          const base = process.env.REACT_APP_API_BASE_URL;
          const [mainRes, dmRes] = await Promise.all([
            fetch(`${base}/api/users/checkUnreadMainChat`, {
              credentials: "include",
            }),
            fetch(`${base}/api/dm/userConversations/${currentUser._id}`, {
              credentials: "include",
            }),
          ]);
          const main = mainRes.ok ? await mainRes.json() : { count: 0 };
          const dms = dmRes.ok ? await dmRes.json() : [];
          const entries = [[MAIN_ROOM_ID, Number(main?.count || 0)]];
          for (const c of Array.isArray(dms) ? dms : []) {
            entries.push([String(c._id), Number(c.unreadCount || 0)]);
          }
          setMany(entries);
        } catch (_) {}
      })();
    }, 800);
    return () => clearTimeout(timeout);
  }, [currentUser, location.pathname, setNotifications, setMany, MAIN_ROOM_ID]);

  // 💬 mensagens no chat principal
  useEffect(() => {
    if (!currentUser) return;
    if (!socket || typeof socket.on !== "function") return;

    const handleNewMessage = ({ roomId }) => {
      const onMain = location.pathname === "/chat";
      if (roomId === MAIN_ROOM_ID && !onMain) increment(MAIN_ROOM_ID, 1);
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, currentUser, location.pathname, increment, MAIN_ROOM_ID]);

  // 📩 DMs (privadas)
  useEffect(() => {
    if (!currentUser) return;
    if (!socket || typeof socket.on !== "function") return;

    const handleNewPrivateMessage = ({ conversationId }) => {
      const here = location.pathname === `/privateChat/${conversationId}`;
      if (!here) increment(String(conversationId), 1);
    };
    const onPrivateChatRead = ({ conversationId }) =>
      reset(String(conversationId));

    socket.on("newPrivateMessage", handleNewPrivateMessage);
    socket.on("privateChatRead", onPrivateChatRead);

    return () => {
      socket.off("newPrivateMessage", handleNewPrivateMessage);
      socket.off("privateChatRead", onPrivateChatRead);
    };
  }, [socket, currentUser, location.pathname, increment, reset]);

  return (
    <div className="footerContainer">
      <Link to={"/"}>
        {location.pathname === "/" ? (
          <HomeIconSolid className="icon" />
        ) : (
          <HomeIcon className="icon" />
        )}
      </Link>

      <div className="notificationIcon" onClick={navigateToMainChat}>
        {location.pathname === "/chat" ? (
          <MessageIconSolid className="icon" />
        ) : (
          <MessageIcon className="icon" />
        )}
        {total > 0 && <span className="notificationStatus">{total}</span>}
      </div>

      {currentUser && (
        <Link to="/newlisting">
          {location.pathname === "/newlisting" ? (
            <PlusIconSolid className="icon" />
          ) : (
            <PlusIcon className="icon" />
          )}
        </Link>
      )}

      <div className="notificationIcon">
        <Link to="/notifications">
          {location.pathname === "/notifications" ? (
            <BellIconSolid className="icon" />
          ) : (
            <BellIcon className="icon" />
          )}
          {notifications && <span className="notificationStatus" />}
        </Link>
      </div>

      <div className="reelsIcon">
        <Link to="/reels">
          {location.pathname === "/reels" ? (
            <PlayIconSolid className="icon" />
          ) : (
            <PlayIcon className="icon" />
          )}
        </Link>
      </div>
    </div>
  );
};


export default Footer;