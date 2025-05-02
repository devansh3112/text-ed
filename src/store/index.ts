import { create } from 'zustand';
import { User } from '../types';

interface Store {
  users: User[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  setUsers: (users: User[]) => void;
}

export const useStore = create<Store>((set) => ({
  users: [],
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  removeUser: (userId) => set((state) => ({ users: state.users.filter((u) => u.id !== userId) })),
  setUsers: (users) => set({ users }),
})); 