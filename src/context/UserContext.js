// src/context/UserContext.js
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const UserContext = createContext();
const UsersContext = createContext();

export const useUser = () => useContext(UserContext);
export const useUsers = () => useContext(UsersContext);

export const UserProvider = ({ children }) => {
  const { socket, connectSocket, disconnectSocket } = useSocket(); // ✅ desestruturação correta
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const hasFetchedUserRef = useRef(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_BASE_URL;
  // knobs de teste (10s idle, 5s ping)
  const HEARTBEAT_MS = process.env.REACT_APP_HEARTBEAT_MS || 5000;
  const IDLE_AFTER_MS = process.env.REACT_APP_IDLE_AFTER_MS || 10000;

  // ---- helpers ----

  const wakeServerAndConnectSocket = useCallback(async () => {
    try {
      await fetch(`${API}/api/users/ping`).catch(() => {});
      // ✅ connect as guest if needed
      if (!socket?.connected) connectSocket?.();
    } catch (err) {
      console.error("❌ Erro ao acordar servidor:", err);
    }
  }, [API, connectSocket, socket?.connected]);

  useEffect(() => {
    if (!socket) return;
    // ✅ Always keep a socket connection (guest or logged-in)
    if (!socket.connected) connectSocket?.();
    // if (currentUser && !socket.connected) connectSocket?.();
    // if (!currentUser && socket.connected) socket.disconnect();
  }, [socket, connectSocket, currentUser]);

  // ✅ ÚNICO effect para "connect": addUser + getOnlineUsers
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (currentUser) socket.emit("addUser"); // só se estiver logado
      socket.emit("getOnlineUsers"); // SEMPRE (guest ou logado)
    };

    socket.on("connect", onConnect);
    if (socket.connected) onConnect(); // cobre reconexão instantânea
    return () => socket.off("connect", onConnect);
  }, [socket, currentUser]);

  // Restaura user e acorda socket (primeiro load)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      wakeServerAndConnectSocket();
    }
  }, [wakeServerAndConnectSocket]);

  // onlineUsers listener (opcional: ping inicial se já conectado)
  // onlineUsers listener (mantém HB e tudo mais como está)
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (users = []) => {
      if (!Array.isArray(users)) return;

      // filtra apenas os ativos e válidos
      const activeUsers = users.filter(
        (u) => u && u._id && u.presenceStatus === "active"
      );

      // remove duplicados
      const seen = new Set();
      const filtered = [];

      for (const u of activeUsers) {
        const key = String(u._id);
        if (seen.has(key)) continue;
        seen.add(key);

        filtered.push({
          _id: u._id,
          username: u.username,
          profileImage: u.profileImage,
          presenceStatus: u.presenceStatus, // sempre "active"
          lastHeartbeat: u.lastHeartbeat,
        });
      }

      // ordena por lastHeartbeat (mais recente primeiro)
      filtered.sort((a, b) => {
        const aTime = a.lastHeartbeat ? new Date(a.lastHeartbeat).getTime() : 0;
        const bTime = b.lastHeartbeat ? new Date(b.lastHeartbeat).getTime() : 0;
        return bTime - aTime;
      });

      setOnlineUsers(filtered);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    // sempre pede a lista atual ao conectar / trocar user
    if (socket.connected) socket.emit("getOnlineUsers");

    return () => socket.off("onlineUsers", handleOnlineUsers);
  }, [socket, currentUser?._id]);

  // Heartbeat (seu endpoint; se não existir, apenas ignora o erro)
  // Heartbeat + presença baseada em visibilidade e inatividade
  useEffect(() => {
    if (!currentUser?._id) return;

    let hbInterval = null; // intervalo do heartbeat
    let idleTimer = null; // timer de inatividade
    let isIdle = false; // flag local

    const ping = () => {
      fetch(`${API}/api/presence/heartbeat`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    };

    const startHeartbeat = () => {
      ping(); // manda um já
      if (hbInterval) clearInterval(hbInterval);
      hbInterval = setInterval(() => {
        if (!document.hidden && socket?.connected && !isIdle) {
          ping();
        }
      }, HEARTBEAT_MS);
      socket?.emit?.("presence:active");
      socket?.emit?.("getOnlineUsers");
    };

    const stopHeartbeat = () => {
      if (hbInterval) clearInterval(hbInterval);
      hbInterval = null;
    };

    const goIdle = () => {
      if (isIdle) return;
      isIdle = true;
      stopHeartbeat();
      socket?.emit?.("presence:idle");
      socket?.emit?.("getOnlineUsers");
    };

    const goActive = () => {
      if (!isIdle && hbInterval) return; // já ativo com HB rodando
      isIdle = false;
      startHeartbeat();
    };

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (!document.hidden) {
        idleTimer = setTimeout(goIdle, IDLE_AFTER_MS);
      }
    };

    const onActivity = () => {
      if (document.hidden) return;
      if (isIdle) goActive();
      resetIdleTimer();
    };

    const onVisibility = () => {
      if (document.hidden) {
        goIdle();
      } else {
        goActive();
        resetIdleTimer();
      }
    };

    // bootstrap
    if (!document.hidden) {
      goActive();
      resetIdleTimer();
    } else {
      goIdle();
    }

    // listeners
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("blur", onVisibility);
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });

    const onPageHide = () => socket?.emit?.("presence:idle");
    window.addEventListener("pagehide", onPageHide);

    return () => {
      stopHeartbeat();
      if (idleTimer) clearTimeout(idleTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("blur", onVisibility);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [API, currentUser?._id, socket?.connected, HEARTBEAT_MS, IDLE_AFTER_MS]);

  // Valida cookie e reenvia presença (primeira hidratação com socket já disponível)
  // Valida cookie e reconecta — NÃO precisa emitir addUser aqui
  useEffect(() => {
    if (!socket) return;
    const run = async () => {
      if (hasFetchedUserRef.current) return;
      hasFetchedUserRef.current = true;

      const stored = localStorage.getItem("user");
      if (!stored) return;

      const user = JSON.parse(stored);
      setCurrentUser(user);

      setTimeout(async () => {
        try {
          const res = await fetch(`${API}/api/users/current`, {
            credentials: "include",
          });
          if (!res.ok) {
            console.log("Usuário não autenticado.");
            throw new Error("Usuário não autenticado.");
          }
          const verified = await res.json();
          setCurrentUser(verified);
          localStorage.setItem("user", JSON.stringify(verified));
          connectSocket?.(); // ✅ só conecta; o effect do "connect" faz o resto
        } catch {
          console.warn(
            "⚠️ Cookie inválido/expirado. Mantendo user do localStorage."
          );
          setCurrentUser(user);
        }
      }, 500);
    };
    run();
  }, [API, socket, connectSocket]);

  // Reidrata ao focar/visível/pageshow
  useEffect(() => {
    let busy = false;
    const rehydrate = async () => {
      if (busy) return;
      busy = true;
      setTimeout(() => (busy = false), 800);

      const stored = localStorage.getItem("user");
      if (!stored) return;

      try {
        const res = await fetch(`${API}/api/users/current`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("no auth");
        const verified = await res.json();
        setCurrentUser(verified);
        localStorage.setItem("user", JSON.stringify(verified));
        await wakeServerAndConnectSocket();
      } catch {
        // mantém estado atual
      }
    };

    const onFocus = () => rehydrate();
    const onVisibility = () =>
      document.visibilityState === "visible" && rehydrate();
    const onPageShow = () => rehydrate();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [API, wakeServerAndConnectSocket]);

  // Sync entre abas (padronize a chave!)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "auth:event") return; // ✅ use sempre "auth:event"
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        wakeServerAndConnectSocket();
      } else {
        setCurrentUser(null);
        // ✅ drop auth and reconnect as guest
        try {
          disconnectSocket?.();
        } catch {}
        connectSocket?.();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [socket, wakeServerAndConnectSocket]);

  // ---- ações públicas ----
  // login — idem: não emitir addUser aqui
  const login = (user /*, token? */) => {
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth:event", String(Date.now()));
    if (!socket?.connected) connectSocket?.();
  };

  const logout = async ({ reason } = {}) => {
    const userId = currentUser?._id;

    localStorage.removeItem("user");
    localStorage.removeItem("auth:event");
    localStorage.removeItem("refreshToken");

    // avisa outras abas que houve mudança de auth
    localStorage.setItem("auth:event", String(Date.now()));

    // avisa o servidor — novo padrão
    socket?.emit?.("removeSocket");

    try {
      // alinhe com seu back: você tem /api/users/signout (não /api/auth/logout)
      await fetch(`${API}/api/users/signout/${userId}`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}

    setOnlineUsers([]); // limpa lista local imediatamente
    setCurrentUser(null);

    const finish = () => {
      // garante handshake sem auth e encerra conexão
      socket.auth = {};
      try {
        disconnectSocket?.(); // remove token + disconnect
        connectSocket?.(); // ✅ reconnect as guest so the online list keeps updating
      } catch {}
      // navigate("/");
      navigate(reason ? `/login?reason=${encodeURIComponent(reason)}` : "/");
    };

    // tenta atualizar a lista e depois fecha
    if (socket?.connected) {
      const once = (users) => {
        setOnlineUsers(users.filter((u) => String(u._id) !== String(userId)));
        socket?.off?.("onlineUsers", once);
        finish();
      };
      socket.once?.("onlineUsers", once);
      socket.emit?.("getOnlineUsers");
      setTimeout(() => {
        socket?.off?.("onlineUsers", once);
        finish();
      }, 800);
    } else {
      finish();
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onForceLogout = ({ reason } = {}) => {
      logout({ reason: reason || "BANNED" });
    };
    socket.off("force-logout", onForceLogout); // evita duplicar listeners
    socket.on("force-logout", onForceLogout);
    return () => {
      socket.off("force-logout", onForceLogout);
    };
  }, [socket, logout]);

  console.log("onlineUsers:", onlineUsers);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        darkMode,
        setDarkMode,
      }}
    >
      <UsersContext.Provider value={{ onlineUsers }}>
        {children}
      </UsersContext.Provider>
    </UserContext.Provider>
  );
};
