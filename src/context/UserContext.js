import {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const UserContext = createContext();
const UsersContext = createContext();

export const useUser = () => useContext(UserContext);
export const useUsers = () => useContext(UsersContext);

export const UserProvider = ({ children }) => {
  const socket = useSocket();
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const hasFetchedUserRef = useRef(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_BASE_URL;

  // ---- helpers ----
  const emitLogin = useCallback((user) => {
    if (!user || !socket) return;
    socket.emit("userLoggedIn", {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage || "https://img.freepik.com/premium-vector/vector-flat-illustration-grayscale-avatar-user-profile-person-icon-gender-neutral-silhouette-profile-picture-suitable-social-media-profiles-icons-screensavers-as-templatex9xa_719432-2210.jpg?w=360",
    });
  }, [socket]); // ✅ depende do socket

  const wakeServerAndConnectSocket = useCallback(
    async (user) => {
      try {
        await fetch(`${API}/api/users/ping`);
        if (socket && !socket.connected) socket.connect();
        if (socket) emitLogin(user);
      } catch (err) {
        console.error("❌ Erro ao acordar servidor:", err);
      }
    },
    [API, socket, emitLogin] // ✅ inclui socket
  );

  // Restaura user e acorda socket
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      wakeServerAndConnectSocket(u);
    }
  }, [wakeServerAndConnectSocket]);

  // Re-conexão
  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      if (currentUser) emitLogin(currentUser);
      setTimeout(() => socket.emit("getOnlineUsers"), 200);
    };
    socket.on("connect", onConnect);
    return () => socket.off("connect", onConnect);
  }, [socket, currentUser, emitLogin]); // ✅ inclui socket

  // onlineUsers listener
  useEffect(() => {
    if (!socket) return;
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("onlineUsers", handleOnlineUsers);
    // opcional: pedir lista ao montar se já conectado
    if (socket.connected) socket.emit("getOnlineUsers");
    return () => socket.off("onlineUsers", handleOnlineUsers);
  }, [socket]); // ✅ inclui socket

  // Heartbeat (não precisa de socket)
  useEffect(() => {
    if (!currentUser?._id) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetch(`${API}/api/presence/heartbeat`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [API, currentUser?._id]);

  // Valida cookie e reenvia login
  useEffect(() => {
    if (!socket) return; // ✅ e re-dispara quando socket chegar
    const run = async () => {
      if (hasFetchedUserRef.current) return;
      hasFetchedUserRef.current = true;

      const stored = localStorage.getItem("user");
      if (!stored) return;

      const user = JSON.parse(stored);
      setCurrentUser(user);

      setTimeout(async () => {
        try {
          const res = await fetch(`${API}/api/users/current`, { credentials: "include" });
          if (!res.ok) throw new Error("Usuário não autenticado.");
          const verified = await res.json();
          setCurrentUser(verified);
          localStorage.setItem("user", JSON.stringify(verified));
          if (socket.connected) emitLogin(verified);
          else socket.connect();
        } catch {
          console.warn("⚠️ Cookie inválido/expirado. Mantendo user do localStorage.");
          setCurrentUser(user);
        }
      }, 500);
    };
    run();
  }, [API, socket, emitLogin]); // ✅ inclui socket

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
        const res = await fetch(`${API}/api/users/current`, { credentials: "include" });
        if (!res.ok) throw new Error("no auth");
        const verified = await res.json();
        setCurrentUser(verified);
        localStorage.setItem("user", JSON.stringify(verified));
        await wakeServerAndConnectSocket(verified);
      } catch {
        // mantém estado atual
      }
    };

    const onFocus = () => rehydrate();
    const onVisibility = () => {
      if (document.visibilityState === "visible") rehydrate();
    };
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

  // Sync entre abas
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "auth:event") return;
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
        wakeServerAndConnectSocket(u);
      } else {
        setCurrentUser(null);
        if (socket) socket.disconnect();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [socket, wakeServerAndConnectSocket]); // ✅ inclui socket

  // ---- ações públicas ----
  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth:event", String(Date.now()));
    if (socket) {
      if (socket.connected) emitLogin(user);
      else socket.connect();
    }
    fetch(`${API}/api/users/debug/cookies`, { credentials: "include" }).catch(() => {});
  };

  const logout = async () => {
    const userId = currentUser?._id;

    // apenas emite se houver socket, mas NÃO sai da função
    if (userId && socket) {
      socket.emit("userLoggedOut", { _id: userId, username: currentUser.username });
    }

    try {
      await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (_) {}

    setCurrentUser(null);
    localStorage.removeItem("user");
    localStorage.setItem("auth:event", String(Date.now()));

    const handleUpdatedOnlineUsers = (users) => {
      // remove este usuário e segue para desconectar
      setOnlineUsers(users.filter((u) => u._id !== userId));
      if (socket) {
        socket.off("onlineUsers", handleUpdatedOnlineUsers);
        socket.disconnect();
      }
      navigate("/");
    };

    if (socket?.connected) {
      socket.once("onlineUsers", handleUpdatedOnlineUsers);
      socket.emit("getOnlineUsers");
      setTimeout(() => {
        if (socket) socket.off("onlineUsers", handleUpdatedOnlineUsers);
        if (socket) socket.disconnect();
        navigate("/");
      }, 800);
    } else {
      if (socket) socket.disconnect();
      navigate("/");
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout, darkMode, setDarkMode }}>
      <UsersContext.Provider value={{ onlineUsers }}>
        {children}
      </UsersContext.Provider>
    </UserContext.Provider>
  );
};
