import { io, Socket } from 'socket.io-client';
import { TextChangeEvent, CursorMoveEvent, RoomLockEvent, RoomUserEvent } from './types';

// In development, use localhost. In production, use the Render.com URL
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://text-ed-nmdl.onrender.com'  // Your Render.com URL (note: using https, not wss)
  : 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

// Connection status handlers
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from Socket.IO server:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
  console.error('Socket.IO reconnection error:', error);
});

// Room management
export const joinRoom = (roomId: string, name: string) => {
  socket.emit('join-room', { room: roomId, name });
};

export const leaveRoom = (roomId: string) => {
  socket.emit('leave-room', { room: roomId });
};

// Text synchronization
export const emitTextChange = (data: TextChangeEvent) => {
  socket.emit('text-change', data);
};

export const onTextChange = (callback: (data: TextChangeEvent) => void) => {
  socket.on('text-change', callback);
};

// Cursor tracking
export const emitCursorMove = (data: CursorMoveEvent) => {
  socket.emit('cursor-move', data);
};

export const onCursorMove = (callback: (data: CursorMoveEvent) => void) => {
  socket.on('cursor-move', callback);
};

// Room locking
export const emitRoomLock = (data: RoomLockEvent) => {
  socket.emit('room-lock', data);
};

export const onRoomLock = (callback: (data: RoomLockEvent) => void) => {
  socket.on('room-lock', callback);
};

// User management
export const onUserJoined = (callback: (user: RoomUserEvent) => void) => {
  socket.on('userJoined', callback);
};

export const onUserLeft = (callback: (userId: string) => void) => {
  socket.on('userLeft', callback);
};

export const onRoomUsers = (callback: (users: RoomUserEvent[]) => void) => {
  socket.on('roomUsers', callback);
};

// Cleanup function
export const cleanup = () => {
  socket.off('text-change');
  socket.off('cursor-move');
  socket.off('room-lock');
  socket.off('userJoined');
  socket.off('userLeft');
  socket.off('roomUsers');
  socket.disconnect();
}; 