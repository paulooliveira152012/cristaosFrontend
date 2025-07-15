import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  fetchNotifications,
  acceptFriendRequest,
  rejectFriendRequest,
  markNotificationAsRead,
} from "./functions/functions/notificationsFunctions.js";
import "../styles/notifications.css";

export const Notifications = () => {
  const { currentUser } = useUser();
  const [friendRequests, setFriendRequests] = useState([]);
  const [otherNotifications, setOtherNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        const allNotifs = await fetchNotifications();

        // Separar pedidos de amizade das outras notificações
        const requests = allNotifs.filter((n) => n.type === "friend_request");
        const others = allNotifs.filter((n) => n.type !== "friend_request");

        setFriendRequests(requests);
        setOtherNotifications(others);
      } catch (error) {
        console.error("Erro ao carregar notificações:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleAccept = async (requesterId) => {
    await acceptFriendRequest(requesterId);
    setFriendRequests((prev) => prev.filter((r) => r.fromUser._id !== requesterId));
  };

  const handleReject = async (requesterId) => {
    await rejectFriendRequest(requesterId);
    setFriendRequests((prev) => prev.filter((r) => r.fromUser._id !== requesterId));
  };

  const handleNotificationClick = async (notifId) => {
    await markNotificationAsRead(notifId);
    setOtherNotifications((prev) =>
      prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
    );
  };

  if (loading) return <p>Carregando notificações...</p>;

  return (
    <div className="notificationsContainer">
      <h2>Notificações</h2>

      {friendRequests.length > 0 && (
        <div className="friendRequests">
          <h3>Pedidos de amizade</h3>
          <ul>
            {friendRequests.map((request) => (
              <li key={request._id}>
                <strong>{request.fromUser.username}</strong> quer ser seu amigo!
                <button onClick={() => handleAccept(request.fromUser._id)}>Aceitar</button>
                <button onClick={() => handleReject(request.fromUser._id)}>Rejeitar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="generalNotifications">
        <h3>Outras notificações</h3>
        {otherNotifications.length > 0 ? (
          <ul>
            {otherNotifications.map((notif) => (
              <li
                key={notif._id}
                className={notif.isRead ? "read" : "unread"}
                onClick={() => handleNotificationClick(notif._id)}
              >
                {notif.content}
              </li>
            ))}
          </ul>
        ) : (
          <p>Você não tem novas notificações.</p>
        )}
      </div>
    </div>
  );
};
