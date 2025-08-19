// footerFunctions.js
const baseUrl = process.env.REACT_APP_API_BASE_URL;

const authHeaders = () => {
  const token = localStorage.getItem("authToken");
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export const checkForNewNotifications = async (setNotifications) => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "GET",
      credentials: "include",
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      // Não zere badge agressivamente em caso de 401
      console.warn("GET /api/notifications falhou:", res.status);
      return { unreadCount: 0, data: null };
    }

    const data = await res.json();
    const unreadCount = data.filter((n) => !n.isRead).length;
    setNotifications(unreadCount > 0);
    return { unreadCount, data };
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    return { unreadCount: 0, data: null };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Erro ao marcar notificações como lidas.");
    return await res.json();
  } catch (err) {
    console.error("Erro ao marcar notificações como lidas:", err);
    return null;
  }
};

export const checkForNewMessages = async (setUnreadMessagesCount, userId) => {
  try {
    const h = authHeaders();

    const resMain = await fetch(
      `${baseUrl}/api/users/checkUnreadMainChat`,
      { credentials: "include", headers: h, cache: "no-store" }
    );
    const dataMain = resMain.ok ? await resMain.json() : { count: 0 };

    const resDM = await fetch(
      `${baseUrl}/api/dm/totalUnread/${userId}`,
      { credentials: "include", headers: h, cache: "no-store" }
    );
    const dataDM = resDM.ok ? await resDM.json() : { totalUnread: 0 };

    const totalUnread = (dataMain.count || 0) + (dataDM.totalUnread || 0);
    setUnreadMessagesCount(totalUnread);
  } catch (err) {
    console.error("Erro ao verificar mensagens não lidas:", err);
    setUnreadMessagesCount(0);
  }
};
