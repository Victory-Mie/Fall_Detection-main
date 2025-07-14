import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { io, Socket } from 'socket.io-client';

interface FallDetectionData {
  type: string;
  timestamp: string;
  image_path: string;
  fall_id: string;
  confidence: number;
}

// Python WebSocket 服务（用于视频流和摔倒检测）
export const pythonWebSocket = {
  socket: null as Socket | null,
  isConnected: false,
  fallDetectionCallback: null as ((fallData: FallDetectionData) => void) | null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: null as number | null,

  connect() {
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('Connected to Python WebSocket (Socket.IO)');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // 连接成功后自动启动检测
      setTimeout(() => {
        this.startDetection();
      }, 1000);
    });

    this.socket.on('fall_detection', (fallData) => {
      console.log('Received fall detection:', fallData);
      if (this.fallDetectionCallback) {
        this.fallDetectionCallback(fallData);
      }
    });

    this.socket.on('status', (data) => {
      console.log('Status from Python:', data);
    });

    this.socket.on('emergency_confirmed', (data) => {
      console.log('Emergency confirmed:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Python WebSocket');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Python WebSocket connection error:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to Python WebSocket after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to Python WebSocket');
      this.isConnected = false;
    });
  },

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectInterval = window.setTimeout(() => {
        if (!this.isConnected) {
          console.log('Attempting to reconnect...');
          this.connect();
        }
      }, delay);
    }
  },

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  },

  send(data: Record<string, unknown>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', data);
    }
  },

  // 发送紧急警报
  sendEmergencyAlert(fallId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('emergency_alert', {
        fallId,
        timestamp: Date.now()
      });
    }
  },

  // 设置摔倒检测回调
  setFallDetectionCallback(callback: (fallData: FallDetectionData) => void) {
    this.fallDetectionCallback = callback;
  },

  // 启动检测
  startDetection() {
    if (this.socket && this.isConnected) {
      console.log('Sending start_detection event');
      this.socket.emit('start_detection');
    } else {
      console.warn('Cannot start detection: WebSocket not connected');
    }
  },

  // 停止检测
  stopDetection() {
    if (this.socket && this.isConnected) {
      console.log('Sending stop_detection event');
      this.socket.emit('stop_detection');
    } else {
      console.warn('Cannot stop detection: WebSocket not connected');
    }
  }
};