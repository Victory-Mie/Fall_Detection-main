import { create } from "zustand";

interface User {
  id: string;
  username: string;
}

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));
