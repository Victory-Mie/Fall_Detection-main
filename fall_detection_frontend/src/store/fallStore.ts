import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FallEvent {
  id: string;
  timestamp: string;
  status: 'confirmed' | 'false_alarm' | 'emergency';
  dialog: string;
  imageUrl?: string;
}

interface FallState {
  events: FallEvent[];
  loading: boolean;
  error: string | null;
  // 添加事件
  addEvent: (event: FallEvent) => void;
  // 删除事件
  deleteEvent: (id: string) => void;
  // 更新事件状态
  updateEventStatus: (id: string, status: FallEvent['status']) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 设置错误信息
  setError: (error: string | null) => void;
  // 设置所有事件
  setEvents: (events: FallEvent[]) => void;
}

export const useFallStore = create<FallState>()(
  persist(
    (set) => ({
      events: [],
      loading: false,
      error: null,
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      deleteEvent: (id) => set((state) => ({ events: state.events.filter((event) => event.id !== id) })),
      updateEventStatus: (id, status) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, status } : event
          ),
        })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setEvents: (events) => set({ events }),
    }),
    {
      name: 'fall-events-storage',
    }
  )
);