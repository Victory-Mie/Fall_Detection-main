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

// 音频转换工具函数
const audioUtils = {
  // 将音频Blob转换为原始字节数据
  async convertToRawBytes(audioBlob: Blob): Promise<Uint8Array> {
    try {
      // 直接获取原始字节数据
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log('Audio converted to raw bytes:', {
        originalSize: arrayBuffer.byteLength,
        dataSize: uint8Array.length,
        mimeType: audioBlob.type
      });
      
      return uint8Array;
    } catch (error) {
      console.error('Failed to convert audio to raw bytes:', error);
      throw error;
    }
  }
};

// Java WebSocket 音频转写服务（使用STOMP协议）
export const audioWebSocket = {
  stompClient: null as Client | null,
  isConnected: false,
  sessionId: '',
  transcriptionCallback: null as ((text: string, isLast: boolean) => void) | null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  maxChunkSize: 8192, // 8KB 限制
  connectionCheckInterval: null as number | null,

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Attempting to connect to Java Audio WebSocket...');
        
        // 使用SockJS连接STOMP端点
        const socket = new SockJS('http://localhost:8083/ws/audio');
        
        this.stompClient = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          debug: (str: string) => {
            console.log('STOMP Debug:', str);
          },
          onConnect: () => {
            console.log('Connected to Java Audio WebSocket (STOMP)');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.sessionId = `session-${Date.now()}`;
            
            // 启动连接状态监控
            this.startConnectionMonitoring();
            
            // 延迟订阅，确保连接稳定
            setTimeout(() => {
              this.subscribeToResults();
            }, 1000);
            
            resolve();
          },
          onDisconnect: () => {
            console.log('Disconnected from Java Audio WebSocket');
            this.isConnected = false;
            this.stopConnectionMonitoring();
          },
          onStompError: (error: unknown) => {
            console.error('STOMP error:', error);
            this.isConnected = false;
            this.stopConnectionMonitoring();
            reject(error);
          },
        });

        this.stompClient.activate();
        
        // 设置超时
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  },

  disconnect() {
    this.stopConnectionMonitoring();
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected = false;
    }
  },

  // 启动连接状态监控
  startConnectionMonitoring() {
    this.connectionCheckInterval = setInterval(() => {
      if (this.stompClient && this.isConnected) {
        console.log('Connection status check - Connected');
      } else {
        console.log('Connection status check - Disconnected');
        this.isConnected = false;
      }
    }, 5000); // 每5秒检查一次
  },

  // 停止连接状态监控
  stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  },

  // 检查连接状态
  checkConnection(): boolean {
    if (!this.stompClient) {
      console.warn('STOMP client not initialized');
      return false;
    }
    
    if (!this.isConnected) {
      console.warn('STOMP client not connected');
      return false;
    }
    
    return true;
  },

  // 强制重新连接
  async forceReconnect(): Promise<void> {
    console.log('Force reconnecting...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    await this.connect();
    console.log('Force reconnect completed');
  },

  // 安全发送消息
  async safePublish(destination: string, body: string): Promise<void> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to send message (attempt ${retryCount + 1}/${maxRetries})`);
        
        if (!this.checkConnection()) {
          console.warn(`Connection lost, attempting to reconnect (attempt ${retryCount + 1}/${maxRetries})`);
          await this.forceReconnect();
        }
        
        console.log('Sending message via STOMP...');
        this.stompClient!.publish({
          destination,
          body
        });
        console.log('Message sent successfully');
        return; // 发送成功，退出循环
      } catch (error) {
        console.error(`Failed to send message (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log('Retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 强制重连
          console.log('Force reconnecting after send failure...');
          await this.forceReconnect();
        }
      }
    }
    
    throw new Error(`Failed to send message after ${maxRetries} attempts`);
  },

  // 订阅转写结果
  subscribeToResults() {
    if (!this.checkConnection()) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    try {
      this.stompClient!.subscribe('/topic/audio-result', (message) => {
        try {
          const result = JSON.parse(message.body);
          console.log('Received transcription result:', result);
          
          if (this.transcriptionCallback && result.text) {
            this.transcriptionCallback(result.text, result.last || false);
          }
        } catch (error) {
          console.error('Failed to parse transcription result:', error);
        }
      });
      console.log('Subscribed to /topic/audio-result');
      
      // 发送测试消息验证连接
      setTimeout(() => {
        this.sendMinimalTestMessage();
      }, 2000);
    } catch (error) {
      console.error('Failed to subscribe to transcription results:', error);
    }
  },

  // 发送测试消息
  sendTestMessage() {
    if (!this.checkConnection()) {
      console.warn('Cannot send test message: WebSocket not connected');
      return;
    }

    try {
      console.log('Sending test message to verify connection...');
      const testBody = JSON.stringify({
        sessionId: this.sessionId,
        audioData: [1, 2, 3, 4, 5], // 简单的测试数据
        last: false
      });
      
      this.safePublish('/app/audio', testBody)
        .then(() => console.log('Test message sent successfully'))
        .catch(error => console.error('Failed to send test message:', error));
    } catch (error) {
      console.error('Failed to prepare test message:', error);
    }
  },

  // 发送最小测试消息
  sendMinimalTestMessage() {
    if (!this.checkConnection()) {
      console.warn('Cannot send minimal test message: WebSocket not connected');
      return;
    }

    try {
      console.log('Sending minimal test message...');
      const testBody = JSON.stringify({
        sessionId: this.sessionId,
        audioData: [], // 空的音频数据
        last: false
      });
      
      this.safePublish('/app/audio', testBody)
        .then(() => console.log('Minimal test message sent successfully'))
        .catch(error => console.error('Failed to send minimal test message:', error));
    } catch (error) {
      console.error('Failed to prepare minimal test message:', error);
    }
  },

  // 设置转写结果回调
  setTranscriptionCallback(callback: (text: string, isLast: boolean) => void) {
    this.transcriptionCallback = callback;
  },

  // 分割音频数据为小块
  splitAudioData(audioData: Uint8Array): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < audioData.length; i += this.maxChunkSize) {
      chunks.push(audioData.slice(i, i + this.maxChunkSize));
    }
    return chunks;
  },

  // 发送音频片段
  async sendAudioChunk(audioBlob: Blob, isLast: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      audioUtils.convertToRawBytes(audioBlob)
        .then(audioData => {
          console.log(`Sending audio chunk, size: ${audioData.length}, last: ${isLast}`);
          console.log('Audio data preview:', Array.from(audioData.slice(0, 10))); // 显示前10个字节
          
          // 检查音频数据大小
          if (audioData.length > this.maxChunkSize) {
            console.warn(`Audio chunk too large (${audioData.length} bytes), splitting into smaller chunks`);
            const chunks = this.splitAudioData(audioData);
            console.log(`Split into ${chunks.length} chunks`);
            
            // 发送所有小块
            this.sendAudioChunksSequentially(chunks, isLast)
              .then(resolve)
              .catch(reject);
            return;
          }
          
          // 构造消息体 - 注意：后端期望的是原始字节数组，不是Base64
          const messageBody = {
            sessionId: this.sessionId,
            audioData: Array.from(audioData), // 转换为普通数组，保持原始字节格式
            last: isLast
          };
          
          console.log('Sending message body:', {
            sessionId: messageBody.sessionId,
            audioDataLength: messageBody.audioData.length,
            last: messageBody.last
          });
          
          this.safePublish('/app/audio', JSON.stringify(messageBody))
            .then(resolve)
            .catch(reject);
        })
        .catch(error => {
          console.error('Failed to send audio chunk:', error);
          reject(error);
        });
    });
  },

  // 顺序发送音频小块
  async sendAudioChunksSequentially(chunks: Uint8Array[], isLast: boolean): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLastChunk = isLast && i === chunks.length - 1;
      
      console.log(`Sending chunk ${i + 1}/${chunks.length}, size: ${chunk.length}, last: ${isLastChunk}`);
      console.log('Chunk data preview:', Array.from(chunk.slice(0, 10))); // 显示前10个字节
      
      // 构造消息体 - 注意：后端期望的是原始字节数组，不是Base64
      const messageBody = {
        sessionId: this.sessionId,
        audioData: Array.from(chunk), // 转换为普通数组，保持原始字节格式
        last: isLastChunk
      };
      
      console.log('Sending chunk message body:', {
        sessionId: messageBody.sessionId,
        audioDataLength: messageBody.audioData.length,
        last: messageBody.last
      });
      
      await this.safePublish('/app/audio', JSON.stringify(messageBody));
      
      // 添加小延迟，避免发送过快
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  },
};