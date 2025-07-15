import axios from 'axios';
import { FallEvent } from '../store/fallStore';

// 创建axios实例 - 连接到 Java Spring Boot 后端
const api = axios.create({
  baseURL: 'http://localhost:8083/api', // 连接到 Java Spring Boot 后端
  timeout: 10000,
});

// 请求拦截器，添加token
api.interceptors.request.use(
  (config) => {
    // 从Zustand store中获取token，而不是直接从localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsedStorage = JSON.parse(authStorage);
        const token = parsedStorage.state?.token;
        // parsedStorage.state?.token的格式为：
        // token:"3c5d6898073d46dc975ced5baa2fa9c4"
        // user: {
        //   id: 1
        //   username: "cathy"
        // }
        if (token) {
          // 确保使用正确的header名称，Java后端期望小写的authorization
          // 使用Bearer token格式
          config.headers.authorization = `Bearer ${token}`;
        }
      } catch {
        console.error('Failed to parse auth storage:');
      }
    } else {
      console.log('No auth storage found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器，处理认证失败
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing auth state...');
      // 认证失败，清除本地存储的认证信息
      localStorage.removeItem('auth-storage');
      // 使用更优雅的方式跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 定义类型
interface UserData {
  username?: string;
  email?: string;
  phone?: string;
  [key: string]: string | undefined;
}

// 用户相关API
export const userApi = {
  // 登录
  login: async (username: string, password: string) => {
    // 调用 Java 后端真实 API
    return api.post('/users/login', { username, password });
  },

  // 注册
  register: async (username: string, email: string, password: string, phoneNumber: string) => {
    // 调用 Java 后端真实 API
    return api.post('/users/register', { username, email, password, phoneNumber });
  },

  // 获取用户信息
  getUserInfo: async () => {
    // 调用 Java 后端真实 API
    return api.get('/users/me');
  },

  // 更新用户信息
  updateUserInfo: async (userData: UserData) => {
    // 调用 Java 后端真实 API
    return api.put('/users/me', userData);
  },
};

// 跌倒事件相关API
export const fallApi = {
  // 获取跌倒事件列表
  getEvents: async (user_id: number, page = 1, size = 10, dateRange?: [string, string]) => {
    const params: Record<string, unknown> = { user_id, page, size };
    if (dateRange) {
      params.startDate = dateRange[0];
      params.endDate = dateRange[1];
    }
    return api.get('/event/list', { params });
  },

  // 保存跌倒事件
  saveEvent: async (sessionId: string, eventType: number, imageUrl?: string) => {
    return api.post('/event/save', {
      sessionId,
      eventType,
      imageUrl
    });
  },

  // 获取单个跌倒事件详情
  getEventById: async (id: string) => {
    return api.get(`/event/${id}`);
  },

  // 删除跌倒事件
  deleteEvent: async (id: string) => {
    return api.delete(`/event/delete/${id}`);
  },

  // 更新跌倒事件状态
  updateEventStatus: async (id: string, status: FallEvent['status']) => {
    return api.patch(`/event/${id}/status`, { status });
  },

  // 获取事件统计数据
  getEventStats: async () => {
    return api.get('/event/stats');
  },

  sendEmergencyEmail: async (email: string, eventId: string) => {
    return api.post('/fall/send-emergency-email', { email, eventId });
  },
};

// 聊天相关API
export const chatApi = {
  // 流式聊天接口（SSE格式）
  streamChat: async (message: string, sessionId?: string) => {
    const request = {
      message,
      sessionId: sessionId || undefined
    };
    
    const response = await api.post('/chat/stream', request, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      responseType: 'stream'
    });
    
    return response;
  },

  // 流式聊天接口（NDJSON格式）
  streamChatJson: async (message: string, sessionId?: string) => {
    const request = {
      message,
      sessionId: sessionId || undefined
    };
    
    const response = await api.post('/chat/stream-json', request, {
      headers: {
        'Accept': 'application/x-ndjson',
      },
      responseType: 'stream'
    });
    
    return response;
  },

  // 清空聊天历史
  clearHistory: async (sessionId: string) => {
    return api.delete(`/chat/history/${sessionId}`);
  },

  // 获取聊天历史
  getDialogs: async (sessionId: string) => {
    return api.get(`/chat/dialogs/${sessionId}`);
  }
};

/**
 * 流式聊天接口（SSE，带 token）
 * @param message 用户消息
 * @param sessionId 会话ID
 * @param onToken 每个token回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const streamChat = async (
  message: string,
  sessionId: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  try {
    // 获取token
    const authStorage = localStorage.getItem('auth-storage');
    let token = '';
    if (authStorage) {
      try {
        const parsedStorage = JSON.parse(authStorage);
        token = parsedStorage.state?.token;
      } catch {
        // 解析失败，token 为空
      }
    }

    const request = { message, sessionId };
    const response = await fetch('http://localhost:8083/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('streamChat后端返回错误:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        // 检查是否以 data: 开头（可能有空格）
        if (line.trim().startsWith('data:')) {
          const data = line.substring(line.indexOf('data:') + 5).trim();
          
          if (data === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const chatResponse = JSON.parse(data);
            
            if (chatResponse.type === 'token' && chatResponse.content && chatResponse.content.trim()) {
              onToken(chatResponse.content);
            } else if (chatResponse.type === 'complete') {
              onComplete();
              return;
            } else if (chatResponse.type === 'error') {
              onError(chatResponse.content || 'Unknown error');
              return;
            }
          } catch {
            // 忽略解析失败
          }
        }
      }
    }
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * 流式聊天接口（NDJSON格式）
 * @param message 用户消息
 * @param sessionId 会话ID
 * @param onToken 每个token回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const streamChatJson = async (
  message: string,
  sessionId: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  try {
    // 获取token
    const authStorage = localStorage.getItem('auth-storage');
    let token = '';
    if (authStorage) {
      try {
        const parsedStorage = JSON.parse(authStorage);
        token = parsedStorage.state?.token;
      } catch {
        // 解析失败，token 为空
      }
    }

    const request = { message, sessionId };
    const response = await fetch('http://localhost:8083/api/chat/stream-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/x-ndjson',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('streamChatJson后端返回错误:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chatResponse = JSON.parse(line);
            if (chatResponse.type === 'token' && chatResponse.content) {
              onToken(chatResponse.content);
            } else if (chatResponse.type === 'complete') {
              onComplete();
              return;
            } else if (chatResponse.type === 'error') {
              onError(chatResponse.content || 'Unknown error');
              return;
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    }
    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  }
};

// 音频相关API
export const audioApi = {
  // 处理音频（已废弃，改用WebSocket）
  processAudio: async (audioData: string, audioFormat: string) => {
    return api.post('/audio/process', { audioData, audioFormat });
  },
  
  // 使用WebSocket进行音频转写
  streamTranscribe: async (
    audioBlob: Blob
  ) => {
    // 将Blob转换为字节数组
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // 这里需要建立WebSocket连接
          // 由于WebSocket需要实时连接，这个方法需要单独实现
          resolve({ data: { text: "WebSocket转写功能需要单独实现" } });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });
  },
};

// 设置相关API
export const settingsApi = {
  // 获取设置
  getSettings: async () => {
    // 调用 Java 后端真实 API
    // return api.get('/settings');
    
    // Mock数据
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        // 监控设置
        sensitivity: 'medium',
        autoRecord: true,

        // 通知设置
        notifyEmergency: true,
        notificationMethod: ['sound', 'popup'],

        // 隐私设置
        dataRetentionPeriod: '30',
        recordingStorage: 'local',

        // 界面设置
        theme: 'light',
      }
    };
    
  },

  // 更新设置
  updateSettings: async (settings: any) => { // Changed from Settings to any to match new_code
    // 调用 Java 后端真实 API
    // return api.put('/settings', settings);
    
    // Mock数据
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Settings update successful'
      }
    };
    
  },
};

export default api;