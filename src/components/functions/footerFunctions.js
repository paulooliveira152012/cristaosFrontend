const baseUrl = process.env.REACT_APP_API_BASE_URL;

// Reaproveita o mesmo token salvo pelo SocketContext (authToken)
const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  const h = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export const checkForNewNotifications = async (setNotifications) => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/`, {
      method: "GET",
      credentials: "include",
       headers: authHeaders(),           // ✅ manda Bearer
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Erro ao buscar notificações");
    const data = await res.json();

    const unreadCount = data.filter(n => !n.isRead).length;
    setNotifications(unreadCount > 0); // se seu contexto usa boolean
    return { unreadCount, data };
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    setNotifications(false);
    return { unreadCount: 0, data: [] };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
      headers: { ...authHeaders(), "Content-Type": "application/json" }, // ✅ Bearer + JSON
    });
    if (!res.ok) throw new Error("Erro ao marcar notificações como lidas.");
    return await res.json();
  } catch (err) {
    console.error("Erro ao marcar notificações como lidas:", err);
  }
};

export const checkForNewMessages = async (setUnreadMessagesCount, userId) => {
  try {
    const resMain = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/users/checkUnreadMainChat`,
      {
         method: "GET",
        credentials: "include",
        headers: authHeaders(),         // ✅ Bearer
        cache: "no-store",
      }
      
    );
    const dataMain = await resMain.json(); // { count: 3 }

    const resDM = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/dm/totalUnread/${userId}`,
      {
        method: "GET",
        credentials: "include",
        headers: authHeaders(),         // ✅ Bearer
        cache: "no-store",
      }
    );
    const dataDM = await resDM.json(); // { totalUnread: 5 }

    const totalUnread = (dataMain.count || 0) + (dataDM.totalUnread || 0);
    setUnreadMessagesCount(totalUnread);
  } catch (err) {
    console.error("Erro ao verificar mensagens não lidas:", err);
    setUnreadMessagesCount(0);
  }
};






