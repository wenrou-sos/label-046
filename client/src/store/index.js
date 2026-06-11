import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

export const useAppStore = create((set, get) => ({
  collapsed: false,
  unreadCount: 0,
  notifications: [],

  toggleCollapsed: () => set({ collapsed: !get().collapsed }),
  setCollapsed: (collapsed) => set({ collapsed }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (list) => set({ notifications: list }),
  addNotification: (item) => set({
    notifications: [item, ...get().notifications].slice(0, 100),
    unreadCount: get().unreadCount + 1
  })
}));
