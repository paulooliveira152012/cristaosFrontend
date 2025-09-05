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
  const { socket, connectSocket } = useSocket(); // ✅ desestruturação correta
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const hasFetchedUserRef = useRef(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_BASE_URL;

  // ---- helpers ----

  const wakeServerAndConnectSocket = useCallback(async () => {
    try {
      await fetch(`${API}/api/users/ping`).catch(() => {});
      if (!socket?.connected) connectSocket?.(); // evita chamada redundante
    } catch (err) {
      console.error("❌ Erro ao acordar servidor:", err);
    }
  }, [API, connectSocket, socket?.connected]);

  useEffect(() => {
    if (!socket?.connected) connectSocket?.(); // conecta como guest também
  }, [socket, connectSocket]);

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
  useEffect(() => {
    if (!socket) return;
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("onlineUsers", handleOnlineUsers);

    if (socket.connected && currentUser?._id) socket.emit("getOnlineUsers");
    return () => socket.off("onlineUsers", handleOnlineUsers);
  }, [socket, currentUser]);

  // Heartbeat (seu endpoint; se não existir, apenas ignora o erro)
  useEffect(() => {
    if (!currentUser?._id) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible" || !socket?.connected) return;
      fetch(`${API}/api/presence/heartbeat`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [API, currentUser?._id, socket?.connected]);

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
        socket?.disconnect?.();
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

    // avisa o servidor — novo padrão
    socket?.emit?.("removeSocket");
    // fallback antigo (se ainda existir no back)
    socket?.emit?.("userLoggedOut", {
      _id: userId,
      username: currentUser?.username,
    });

    try {
      // alinhe com seu back: você tem /api/users/signout (não /api/auth/logout)
      await fetch(`${API}/api/users/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}

    setOnlineUsers([]); // limpa lista local imediatamente
    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.setItem("auth:event", String(Date.now()));

    const finish = () => {
      socket?.disconnect?.();
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
