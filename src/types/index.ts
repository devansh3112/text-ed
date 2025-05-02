import { Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface EditorProps {
  socket: Socket;
  roomId: string;
  isLocked: boolean;
}

export interface TextChangeEvent {
  roomId: string;
  content: string;
  userId: string;
  userName: string;
}

export interface CursorMoveEvent {
  roomId: string;
  position: {
    lineNumber: number;
    column: number;
  };
  userId: string;
  userName: string;
  color: string;
}

export interface RoomLockEvent {
  roomId: string;
  isLocked: boolean;
}

export interface RoomUserEvent {
  id: string;
  name: string;
  color: string;
} 