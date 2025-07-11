import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  // 通知设置
  notificationSettings: {
    sound: boolean;
    vibration: boolean;
    popup: boolean;
  };
  notifyEmergency: boolean; // 跌倒事件通知设置
  updateNotificationSettings: (settings: Partial<ThemeState['notificationSettings']>) => void;
  setNotifyEmergency: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      notificationSettings: {
        sound: true,
        vibration: false,
        popup: true,
      },
      notifyEmergency: false,
      setNotifyEmergency: (value) => set({ notifyEmergency: value }),
      updateNotificationSettings: (settings) =>
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        })),
    }),
    {
      name: 'theme-storage',
    }
  )
);