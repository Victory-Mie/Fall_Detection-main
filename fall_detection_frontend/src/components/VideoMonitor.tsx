import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const VideoMonitor: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fallDetected, setFallDetected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 连接到 Python 后端的视频流
  const connectToPythonBackend = async () => {
    try {
      setConnectionStatus("connecting");

      // 获取摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setIsConnected(true);
        setConnectionStatus("connected");

        console.log("Connected to Python backend video stream");
      }
    } catch (error) {
      console.error("Failed to connect to video stream:", error);
      setConnectionStatus("disconnected");
      setIsConnected(false);
    }
  };

  const disconnectFromPythonBackend = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setIsConnected(false);
    setConnectionStatus("disconnected");
    setFallDetected(false);

    console.log("Disconnected from Python backend video stream");
  };

  const toggleStream = () => {
    if (isStreaming) {
      disconnectFromPythonBackend();
    } else {
      connectToPythonBackend();
    }
  };

  const resetStream = () => {
    disconnectFromPythonBackend();
    setTimeout(() => {
      connectToPythonBackend();
    }, 1000);
  };

  // 监听跌倒检测事件（来自 Python 后端）
  useEffect(() => {
    const handleFallDetected = (event: CustomEvent) => {
      console.log("Fall detected event received:", event.detail);
      setFallDetected(true);

      // 可以在这里添加通知逻辑
      if (Notification.permission === "granted") {
        new Notification("跌倒检测警告", {
          body: "检测到可能的跌倒事件，请及时查看",
          icon: "/favicon.ico",
        });
      }
    };

    window.addEventListener(
      "fallDetected",
      handleFallDetected as EventListener
    );

    return () => {
      window.removeEventListener(
        "fallDetected",
        handleFallDetected as EventListener
      );
    };
  }, []);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      disconnectFromPythonBackend();
    };
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "connecting":
        return (
          <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
        );
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "已连接";
      case "connecting":
        return "连接中...";
      default:
        return "未连接";
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>视频监控</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-muted-foreground">
              {getStatusText()}
            </span>
            {fallDetected && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                跌倒检测
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">📹</div>
                <p className="text-lg font-medium mb-2">视频监控</p>
                <p className="text-sm opacity-75">点击开始按钮连接摄像头</p>
              </div>
            </div>
          )}

          {connectionStatus === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>正在连接摄像头...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Button
              onClick={toggleStream}
              variant={isStreaming ? "destructive" : "default"}
              className="flex-1"
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  停止监控
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  开始监控
                </>
              )}
            </Button>

            <Button
              onClick={resetStream}
              variant="outline"
              disabled={!isConnected}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button variant="outline" disabled={!isConnected}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {isConnected && (
            <div className="mt-3 text-xs text-muted-foreground">
              <p>• 连接到 Python 后端 (localhost:5000)</p>
              <p>• 实时视频流处理</p>
              <p>• 跌倒检测算法运行中</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoMonitor;
