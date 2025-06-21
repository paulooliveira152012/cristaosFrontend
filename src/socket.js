import { io } from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://cristaosbackend.onrender.com"
    : 
    // "http://localhost:5001"
    "http://192.168.3.11:5001"
);

export default socket;
