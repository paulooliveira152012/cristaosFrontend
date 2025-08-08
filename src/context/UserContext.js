import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

const UserContext = createContext();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
const UsersContext = createContext();

export const useUser = () => useContext(UserContext);
export const useUsers = () => useContext(UsersContext);

export const UserProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const hasFetchedUserRef = useRef(false);
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_BASE_URL;

  // ---- socket helpers (memorized) ----
  const emitLogin = useCallback((user) => {
    if (!user) return;
    socket.emit("userLoggedIn", {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage || "https://via.placeholder.com/50",
    });
    // console.log("📡 Emitindo login para socket:", user.username);
  }, []);

  const wakeServerAndConnectSocket = useCallback(
    async (user) => {
      try {
        await fetch(`${API}/api/users/ping`);
        if (!socket.connected) socket.connect();
        emitLogin(user); // sempre emite ao (re)conectar
      } catch (err) {
        console.error("❌ Erro ao acordar servidor:", err);
      }
    },
    [API, emitLogin]
  );

  // ---- restaura user do localStorage ao montar e acorda servidor/socket ----
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      wakeServerAndConnectSocket(u);
    }
  }, [wakeServerAndConnectSocket]);

  // ---- reconexão do socket: reenvia login e pede onlineUsers ----
  useEffect(() => {
    const onConnect = () => {
      // console.log("🔌 Reconectado.");
      if (currentUser) emitLogin(currentUser);
      setTimeout(() => socket.emit("getOnlineUsers"), 200);
    };
    socket.on("connect", onConnect);
    return () => socket.off("connect", onConnect);
  }, [currentUser, emitLogin]);

  // ---- listener de onlineUsers ----
  useEffect(() => {
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("onlineUsers", handleOnlineUsers);
    return () => socket.off("onlineUsers", handleOnlineUsers);
  }, []);

  // ---- heartbeat periódico enquanto autenticado e aba visível ----
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

  // ---- valida cookie do backend uma vez e atualiza currentUser ----
  useEffect(() => {
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
  }, [API, emitLogin]);

  // ---- reidrata ao focar/visível/pageshow (sleep/wake) ----
  useEffect(() => {
    let busy = false;
    const rehydrate = async () => {
      if (busy) return;
      busy = true;
      setTimeout(() => (busy = false), 800);

      try {
        const res = await fetch(`${API}/api/users/current`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("no auth");

        const verified = await res.json();
        setCurrentUser(verified);
        localStorage.setItem("user", JSON.stringify(verified));
        await wakeServerAndConnectSocket(verified);
      } catch {
        // sem sessão no backend -> mantém estado atual
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

  // ---- sync entre abas (login/logout) ----
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
        socket.disconnect();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [wakeServerAndConnectSocket]);

  // ---- ações públicas ----
  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth:event", String(Date.now())); // notifica outras abas
    if (socket.connected) emitLogin(user);
    else socket.connect();

    // debug opcional de cookies
    fetch(`${API}/api/users/debug/cookies`, { credentials: "include" }).catch(
      () => {}
    );
  };

  const logout = () => {
    if (currentUser) {
      const userId = currentUser._id;
      socket.emit("userLoggedOut", {
        _id: userId,
        username: currentUser.username,
      });

      setCurrentUser(null);
      localStorage.removeItem("user");
      localStorage.setItem("auth:event", String(Date.now())); // sync outras abas

      // tenta receber lista atualizada antes de sair
      const handleUpdatedOnlineUsers = (users) => {
        setOnlineUsers(users.filter((u) => u._id !== userId));
        socket.off("onlineUsers", handleUpdatedOnlineUsers);
        socket.disconnect();
        navigate("/");
      };

      socket.once("onlineUsers", handleUpdatedOnlineUsers);
      setTimeout(() => {
        socket.off("onlineUsers", handleUpdatedOnlineUsers);
        socket.disconnect();
        navigate("/");
      }, 1000);
    } else {
      socket.disconnect();
      navigate("/");
    }
  };

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
