// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
  if (!socket) return;
  socket.on("connect", () => {
    console.log("✅ Socket conectado:", socket.id);
  });
  socket.on("disconnect", () => {
    console.warn("❌ Socket desconectado");
  });
}, [socket]);


  useEffect(() => {
    const baseUrl = process.env.REACT_APP_API_BASE_URL;
     console.log("🌐 Socket tentando conectar em:", baseUrl); // ← ADICIONE ISSO
    const newSocket = io(baseUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ [SocketContext] Socket conectado:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.warn("❌ [SocketContext] Socket desconectado");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
