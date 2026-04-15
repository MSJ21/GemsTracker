import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (user: AuthUser, token?: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user, token) => set(s => ({ user, token: token ?? s.token })),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => Boolean(get().token && get().user),
    }),
    { name: 'pracker-auth' }
  )
);
