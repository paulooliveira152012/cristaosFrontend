import React, { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // contagem é a fonte da verdade
  const [unreadCount, setUnreadCount] = useState(0);

  // compat: boolean (se em algum lugar ainda usa)
  const hasUnread = unreadCount > 0;

  // zera imediatamente a badge
  const markAllSeen = () => setUnreadCount(0);

  // calcula a partir de um array de notificações
  const setFromList = (list) => {
    const n = Array.isArray(list) ? list.filter((x) => !x?.isRead).length : 0;
    setUnreadCount(n);
  };

  const value = useMemo(
    () => ({
      // novo API
      unreadCount,
      setUnreadCount,
      markAllSeen,
      setFromList,
      hasUnread,
      // compat legado boolean
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
