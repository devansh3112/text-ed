import { io } from 'socket.io-client';

// In development, use localhost. In production, use the Render.com URL
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://text-ed-nmdl.onrender.com'  // Your Render.com WebSocket URL
  : 'http://localhost:3001';

export const socket = io(SOCKET_URL);

export const joinRoom = (roomId: string) => {
  socket.emit('join-room', roomId);
};

export const emitTextChange = (data: { roomId: string; content: string }) => {
  socket.emit('text-change', data);
};

// Listen for text changes
export const onTextChange = (callback: (data: { content: string }) => void) => {
  socket.on('text-change', callback);
};

// Cleanup function
export const cleanup = () => {
  socket.off('text-change');
  socket.disconnect();
}; 