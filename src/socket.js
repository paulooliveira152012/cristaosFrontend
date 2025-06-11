import { io } from "socket.io-client";

const socket = io(
  process.env.NODE_ENV === 'production'
    ? 'https://cristaosweb-e5a94083e783.herokuapp.com'
    : 'http://localhost:5001'
);

export default socket;
