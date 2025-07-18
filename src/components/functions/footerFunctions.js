const baseUrl = process.env.REACT_APP_API_BASE_URL;

export const checkForNewNotifications = async (setNotifications) => {
  console.log("function call for notifications check...");
  try {
    const response = await fetch(`${baseUrl}/api/notifications/`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar notificações");
    }

    const data = await response.json();
    console.log("Notificações recebidas:", data);

    // ✅ Corrigido: checa se tem ALGUMA notificação NÃO lida
    const hasUnread = data.some((n) => !n.isRead);
    setNotifications(hasUnread);

    return data;
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return [];
  }
};



export const markAllNotificationsAsRead = async () => {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Erro ao marcar notificações como lidas.");
    }

    const data = await res.json();
    console.log("✔️ Todas as notificações foram marcadas como lidas.");
    return data;
  } catch (error) {
    console.error("❌ Erro ao marcar notificações como lidas:", error);
  }
};

