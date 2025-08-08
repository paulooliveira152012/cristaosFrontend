// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client"; // 👈 use named export

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const baseUrl = useMemo(
    () => process.env.REACT_APP_API_BASE_URL || "http://localhost:5001",
    []
  );

  useEffect(() => {
    console.log("🌐 Socket tentando conectar em:", baseUrl);
    const s = io(baseUrl, {
      withCredentials: true,     // se seu back usa cookie/sessão
      // transports: ["websocket"], // só use se você TIVER CERTEZA que polling está desativado no servidor
      // path: "/socket.io",       // só use se você mudou o path no servidor
      reconnection: true,
    });

    setSocket(s);

    const onConnect = () => console.log("✅ [SocketContext] conectado:", s.id);
    const onDisconnect = (reason) => console.warn("❌ [SocketContext] desconectado:", reason);
    const onError = (err) => console.error("⛔ [SocketContext] connect_error:", err?.message, err);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onError);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onError);
      s.disconnect();
    };
  }, [baseUrl]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
