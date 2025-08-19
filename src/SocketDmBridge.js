// src/SocketDmBridge.jsx (JS puro)
import { useEffect } from "react";
import { useSocket } from "./context/SocketContext";
import { useUser } from "./context/UserContext";
import { useNotification } from "./context/NotificationContext";

export default function SocketDmBridge() {
  const { socket } = useSocket(); // << desestruture
  const { currentUser } = useUser();
  const { setUnreadCount, setNotifications } = useNotification();

  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;
    if (!currentUser || !currentUser._id) return;

    function onIncoming(p) {
      // p = { conversationId, from, preview, ts, ... }
      if (p && p.from && String(p.from) === String(currentUser._id)) return; // ignora eco
      if (typeof setUnreadCount === "function") {
        setUnreadCount((n) => n + 1);
      }
      if (typeof setNotifications === "function") {
        setNotifications(true);
      }
    }

    socket.on("dm:incoming", onIncoming);
    socket.on("newPrivateMessage", onIncoming); // mantenha só o que o back realmente emite

    return () => {
      socket.off("dm:incoming", onIncoming);
      socket.off("newPrivateMessage", onIncoming);
    };
  }, [
    socket,
    currentUser && currentUser._id,
    setUnreadCount,
    setNotifications,
  ]);

  return null;
}
