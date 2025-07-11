import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// 初始化Socket连接
export const initSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  // 连接到 Java Spring Boot 后端
  socket = io('http://localhost:8081', {
    auth: {
      token
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket连接成功');
  });

  socket.on('disconnect', () => {
    console.log('Socket连接断开');
  });

  socket.on('error', (error) => {
    console.error('Socket错误:', error);
  });

  return socket;
};

// 获取当前Socket实例
export const getSocket = () => {
  return socket;
};

// 断开Socket连接
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// 监听跌倒事件
export const onFallDetected = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('fall_detected', callback);
  }
};

// 发送用户响应
export const sendUserResponse = (fallId: string, response: string) => {
  if (socket) {
    socket.emit('user_response', { fallId, response });
  }
};

// 监听AI响应
export const onAIResponse = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('ai_response', callback);
  }
};

// 发送紧急警报
export const sendEmergencyAlert = (fallId: string) => {
  if (socket) {
    socket.emit('emergency_alert', { fallId });
  }
};

// 取消紧急警报
export const cancelEmergencyAlert = (fallId: string) => {
  if (socket) {
    socket.emit('cancel_emergency', { fallId });
  }
};

// 发送跌倒检测结果
export const sendFallDetection = (data: any) => {
  if (socket) {
    socket.emit('fall_detection', data);
  }
};