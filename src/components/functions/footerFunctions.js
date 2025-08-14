const baseUrl = process.env.REACT_APP_API_BASE_URL;

export const checkForNewNotifications = async (setNotifications) => {
  console.log("function call for notifications check...");

  const token = localStorage.getItem("token"); // ✅ pegar o token

  try {
    const response = await fetch(`${baseUrl}/api/notifications/`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar notificações");
    }

    const data = await response.json();
    // console.log("Notificações recebidas:", data);

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
  const token = localStorage.getItem("token"); // ✅ pegar o token

  try {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }, 
       
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

export const checkForNewMessages = async (setUnreadMessagesCount, userId) => {
  try {
    const resMain = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/users/checkUnreadMainChat`,
      { credentials: "include" }
    );
    const dataMain = await resMain.json(); // { count: 3 }

    const resDM = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/api/dm/totalUnread/${userId}`,
      { credentials: "include" }
    );
    const dataDM = await resDM.json(); // { totalUnread: 5 }

    const totalUnread = (dataMain.count || 0) + (dataDM.totalUnread || 0);
    setUnreadMessagesCount(totalUnread);
  } catch (err) {
    console.error("Erro ao verificar mensagens não lidas:", err);
    setUnreadMessagesCount(0);
  }
};






