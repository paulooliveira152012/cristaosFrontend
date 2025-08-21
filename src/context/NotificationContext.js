// src/context/NotificationContext.js
import React, { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const incrementUnread = (n = 1) =>
    setUnreadCount((prev) => prev + (Number(n) || 0));

  // transformar todas lidas (chamar imediatamente quando abrir pagina de notificações)
  const markAllSeen = () => setUnreadCount(0);

  const setFromList = (list) => {
    const n = Array.isArray(list) ? list.filter((x) => !x?.isRead).length : 0;
    setUnreadCount(n);
  };

  const hasUnread = unreadCount > 0;

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      incrementUnread,
      markAllSeen,
      setFromList,
      hasUnread,
      // compat legado (evite usar fora até remover):
      notifications: hasUnread,
      setNotifications: (flag) => setUnreadCount(flag ? Math.max(unreadCount, 1) : 0),
    }),
    [unreadCount, hasUnread]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
