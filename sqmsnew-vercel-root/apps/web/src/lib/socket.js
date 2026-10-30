import { io } from 'socket.io-client';

// Vercel serverless functions cannot hold WebSocket connections, so on a
// deployed single-project build we skip Socket.IO. Every page already polls
// the API every 15-30s, so data stays fresh without it.
// Set VITE_ENABLE_SOCKET=true (with VITE_SOCKET_URL) if you host the socket server elsewhere.
const enabled = import.meta.env.VITE_ENABLE_SOCKET === 'true' || import.meta.env.DEV;

const noopSocket = {
  on() { return this; },
  off() { return this; },
  emit() { return this; },
  connect() { return this; },
  disconnect() { return this; }
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = enabled
  ? io(socketUrl, { autoConnect: true, transports: ['websocket', 'polling'] })
  : noopSocket;
