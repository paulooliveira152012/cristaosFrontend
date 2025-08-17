// src/context/SocketContext.js
import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";

const Ctx = createContext({
  socket: null,
  connectSocket: () => {},
  disconnectSocket: () => {},
  reconnectWithToken: () => {},
});

export const useSocket = () => useContext(Ctx);

export const SocketProvider = ({ children }) => {
  const baseUrl = useMemo(
    () => process.env.REACT_APP_API_BASE_URL || "http://localhost:5001",
    []
  );

  // cria a instância UMA vez (autoConnect: false)
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(baseUrl, {
      autoConnect: false,           // 👈 importantíssimo
      withCredentials: true,        // manda cookies no polling
      transports: ["websocket", "polling"],
      reconnection: true,
      // path: "/socket.io",        // só se você tiver mudado no servidor
    });
  }
  const socket = socketRef.current;

  // evita loop de fallback infinito quando token é inválido
  const triedNoTokenRef = useRef(false);

  // logs/diagnóstico + fallback de auth
  useEffect(() => {
    const onConnect = () => {
      triedNoTokenRef.current = false; // reset ao conectar
      console.log("✅ [Socket] conectado:", socket.id);
    };

    const onDisconnect = (reason) =>
      console.warn("❌ [Socket] desconectado:", reason);

    const onError = (err) => {
      console.error("⛔ [Socket] connect_error:", err?.message || err, err);
      // fallback: se falhou por auth/token inválido, tenta reconectar só com cookie uma única vez
      const msg = (err?.message || "").toLowerCase();
      if (!triedNoTokenRef.current && (msg.includes("auth") || msg.includes("token"))) {
        triedNoTokenRef.current = true;
        try {
          socket.auth = {};          // limpa token do handshake
          if (socket.connected) socket.disconnect();
          socket.connect();          // tenta com cookie/sessão
        } catch (e) {
          console.error("[Socket] fallback sem token falhou:", e);
        }
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    // 🔒 em dev/StrictMode o Provider monta/desmonta duas vezes; desconecte no unmount
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      try {
        socket.disconnect();
      } catch {}
    };
  }, [socket]);

  // helpers públicos
  const connectSocket = (token) => {
    // injeta o JWT no handshake (se houver); senão conecta só com cookie/sessão
    socket.auth = token ? { token } : {};
    if (!socket.connected) {
      console.log("🌐 [Socket] conectando em:", baseUrl);
      socket.connect();
    }
    return socket;
  };

  const reconnectWithToken = (nextToken) => {
    // útil para refresh de token pós-login/refresh
    socket.auth = nextToken ? { token: nextToken } : {};
    if (socket.connected) socket.disconnect();
    socket.connect();
  };

  const disconnectSocket = () => {
    try {
      socket.auth = {}; // limpa auth
      if (socket.connected) socket.disconnect();
    } catch (e) {
      console.error("[Socket] erro ao desconectar:", e);
    }
  };

  const value = useMemo(
    () => ({ socket, connectSocket, disconnectSocket, reconnectWithToken }),
    [socket]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
