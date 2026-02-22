import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

/**
 * Returns (or creates) the singleton Socket.io instance.
 * autoConnect: false  — we connect manually after room validation.
 * reconnection: true  — Socket.io will auto-reconnect on network hiccups / refresh.
 */
const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ["polling", "websocket"],
    });
  }
  return socket;
};

/** Connect the socket (idempotent). */
export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

/** Disconnect and destroy the socket instance. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Get the current socket instance (may be null). */
export const getSocketInstance = () => socket;

export default getSocket;
