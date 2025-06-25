import { io } from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://cristaosbackend.onrender.com"
    : `http://${window.location.hostname}:5001`
);

export default socket;
