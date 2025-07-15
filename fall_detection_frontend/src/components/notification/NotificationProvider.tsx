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

  // Play notification sound
  const playNotificationSound = () => {
    if (notificationSettings.sound) {
      try {
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
        setTimeout(() => {
          oscillator.stop();
        }, 300);
      } catch (error) {
        console.error("Failed to play notification sound: ", error);
      }
    }
  };

  // Trigger device vibration
  const triggerVibration = () => {
    if (notificationSettings.vibration && navigator.vibrate) {
      navigator.vibrate(300);
    }
  };

  // Show notification function
  const showNotification = (
    title: string,
    content: string,
    type: "success" | "info" | "warning" | "error" = "info"
  ) => {
    playNotificationSound();
    triggerVibration();
    if (notificationSettings.popup) {
      notification[type]({
        message: title,
        description: content,
        placement: "topRight",
        duration: 4.5,
      });
    } else {
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
