// src/context/SocketContext.js
import React, { createContext, useContext, useMemo, useEffect, useRef } from "react";
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
      autoConnect: false,         // 👈 importantíssimo
      withCredentials: true,      // manda cookies no polling
      transports: ["websocket", "polling"],
      reconnection: true,
      // path: "/socket.io",      // só se tiver mudado no servidor
    });
  }
  const socket = socketRef.current;

  useEffect(() => {
    const getToken = () => localStorage.getItem("authToken") || "";

    // Em qualquer tentativa de reconexão, injeta o token mais recente
    // (no Manager e também no próprio socket)
    socket.io.on("reconnect_attempt", () => {
      socket.auth = { token: getToken() };
    });
    socket.on("reconnect_attempt", () => {
      socket.auth = { token: getToken() };
    });

    const onConnect = () => {
      console.log("✅ [Socket] conectado:", socket.id);
    };

    const onDisconnect = (reason) => {
      console.warn("❌ [Socket] desconectado:", reason);
    };

    const onError = (err) => {
      console.error("⛔ [Socket] connect_error:", err?.message || err, err);
      // garante que a próxima tentativa já leve o token atual
      socket.auth = { token: getToken() };
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    // Em dev/StrictMode, o Provider pode desmontar; desconecte limpo
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
      socket.off("reconnect_attempt");
      try { socket.disconnect(); } catch {}
    };
  }, [socket]);

  // helpers públicos
  const connectSocket = (token) => {
    // salva para reusar em reconexões (mobile troca de rede/aba com frequência)
    if (token) localStorage.setItem("authToken", token);
    const jwt = token || localStorage.getItem("authToken") || undefined;

    // injeta no handshake
    socket.auth = jwt ? { token: jwt } : {};

    // se já estava conectado (ex.: guest), force novo handshake autenticado
    if (socket.connected) socket.disconnect();

    console.log("🌐 [Socket] conectando em:", baseUrl);
    socket.connect();
    return socket;
  };

  const reconnectWithToken = (nextToken) => {
    if (nextToken) localStorage.setItem("authToken", nextToken);
    const jwt = nextToken || localStorage.getItem("authToken") || undefined;
    socket.auth = jwt ? { token: jwt } : {};
    if (socket.connected) socket.disconnect();
    socket.connect();
  };

  const disconnectSocket = () => {
    try {
      socket.auth = {}; // limpa auth no handshake
      localStorage.removeItem("authToken"); // 🔑 remove token persistido
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
