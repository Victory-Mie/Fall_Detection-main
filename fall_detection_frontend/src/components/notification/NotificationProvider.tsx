import React, { createContext, useContext, ReactNode } from "react";
import { message, notification } from "antd";
import { useThemeStore } from "../../store/themeStore";

interface NotificationContextType {
  showNotification: (
    title: string,
    content: string,
    type?: "success" | "info" | "warning" | "error"
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { notificationSettings } = useThemeStore();

  // 播放通知声音
  const playNotificationSound = () => {
    if (notificationSettings.sound) {
      try {
        // 创建音频上下文
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.5;

        oscillator.start();

        // 0.3秒后停止
        setTimeout(() => {
          oscillator.stop();
        }, 300);
      } catch (error) {
        console.error("播放通知声音失败: ", error);
      }
    }
  };

  // 触发设备震动
  const triggerVibration = () => {
    if (notificationSettings.vibration && navigator.vibrate) {
      navigator.vibrate(300);
    }
  };

  // 显示通知的函数
  const showNotification = (
    title: string,
    content: string,
    type: "success" | "info" | "warning" | "error" = "info"
  ) => {
    // 播放声音
    playNotificationSound();

    // 触发震动
    triggerVibration();

    // 根据设置决定是否显示弹窗通知
    if (notificationSettings.popup) {
      // 使用 Ant Design 的 notification 组件
      notification[type]({
        message: title,
        description: content,
        placement: "topRight",
        duration: 4.5,
      });
    } else {
      // 使用 Ant Design 的 message 组件
      message[type](content);
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
