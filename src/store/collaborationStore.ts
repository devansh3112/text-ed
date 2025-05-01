import { create } from 'zustand'

interface User {
  id: string
  name: string
}

interface CollaborationState {
  roomId: string | null
  users: User[]
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
}

export const useCollaborationStore = create<CollaborationState>((set) => ({
  roomId: null,
  users: [],
  joinRoom: (roomId) => set({ roomId }),
  leaveRoom: () => set({ roomId: null }),
})) 