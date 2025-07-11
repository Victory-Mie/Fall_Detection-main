import { audioWebSocket } from './websocket';

export interface AudioRecorder {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  onTranscriptionUpdate: (text: string) => void;
  onRecordingComplete: () => void;
}

class AudioRecorderService implements AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private _isRecording = false;
  private onTranscriptionUpdateCallback: ((text: string) => void) | null = null;
  private onRecordingCompleteCallback: (() => void) | null = null;

  get isRecording(): boolean {
    return this._isRecording;
  }

  onTranscriptionUpdate(callback: (text: string) => void) {
    this.onTranscriptionUpdateCallback = callback;
  }

  onRecordingComplete(callback: () => void) {
    this.onRecordingCompleteCallback = callback;
  }

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // 16kHz采样率
          channelCount: 1, // 单声道
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 使用最简单的音频格式
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/wav";
      }

      console.log("Using audio format:", mimeType);

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
      });

      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          try {
            console.log(
              "Audio chunk received, size:",
              e.data.size,
              "type:",
              e.data.type
            );

            // 实时发送音频片段到WebSocket
            await audioWebSocket.sendAudioChunk(e.data, false);
          } catch (error) {
            console.error("发送音频片段失败:", error);
            // 如果WebSocket失败，使用模拟转写
            if (this.onTranscriptionUpdateCallback) {
              this.onTranscriptionUpdateCallback("语音转写服务暂时不可用，这是模拟的转写结果。");
            }
          }
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          // 发送最后一片音频标记
          await audioWebSocket.sendAudioChunk(
            new Blob([], { type: mimeType }),
            true
          );
        } catch (error) {
          console.error("发送最后音频失败:", error);
        }
        
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        if (this.onRecordingCompleteCallback) {
          this.onRecordingCompleteCallback();
        }
      };

      this.mediaRecorder.start(1000); // 每秒发送一片
      this._isRecording = true;
      console.log("Recording started");
    } catch (error) {
      console.error("Failed to access the microphone:", error);
      throw new Error("Failed to access the microphone. Please check the permission settings");
    }
  }

  async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this._isRecording = false;
      console.log("Recording stopped");
    }
  }

  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this._isRecording = false;
  }
}

// 创建单例实例
export const audioRecorderService = new AudioRecorderService(); 