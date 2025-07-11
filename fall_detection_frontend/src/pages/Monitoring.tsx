import { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Input,
  Space,
  Typography,
  message,
  Alert,
} from "antd";
import { useThemeStore } from "../store/themeStore";
import { AudioOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { pythonWebSocket, audioWebSocket } from "../services/websocket";
import { fallApi, streamChat } from "../services/api";
import { audioRecorderService } from "../services/audioService";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FallData {
  isFallDetected: boolean;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  fallId?: string;
  consecutive_falls?: number; // Added for continuous fall detection
}

const Monitoring = () => {
  const [isFallDetected, setIsFallDetected] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(60);
  const [lastFallTime, setLastFallTime] = useState(0);
  const [consecutiveFalls, setConsecutiveFalls] = useState(0);
  const videoRef = useRef<HTMLImageElement>(null);
  const emergencyTimerRef = useRef<number | null>(null);
  const isEmergencyHandlingRef = useRef<boolean>(false);
  const { notifyEmergency } = useThemeStore();

  // Connect to Python WebSocket service
  useEffect(() => {
    // 连接到 Python 后端的 WebSocket
    pythonWebSocket.connect();

    // 设置摔倒检测回调
    pythonWebSocket.setFallDetectionCallback((fallData) => {
      // 防止重复触发
      if (isFallDetected) {
        return;
      }

      // 触发摔倒检测处理
      handleFallDetection({
        isFallDetected: true,
        confidence: fallData.confidence,
        timestamp: Date.now(),
        fallId: fallData.fall_id,
      });
    });

    // 延迟启动检测，确保连接稳定
    setTimeout(() => {
      pythonWebSocket.startDetection();
      message.info("摔倒检测已启动");
    }, 2000);

    // 连接到 Java 后端的音频 WebSocket
    const connectAudioWebSocket = async () => {
      try {
        await audioWebSocket.connect();

        // 设置音频转写结果回调
        audioWebSocket.setTranscriptionCallback((text, isLast) => {
          setUserResponse((prev) => prev + text);
          if (isLast) {
            message.success("语音转写完成");
          }
        });

        message.success("音频服务连接成功");
      } catch (error) {
        console.error("Failed to connect to audio WebSocket:", error);
        message.error("音频服务连接失败，将使用模拟转写功能");
      }
    };

    connectAudioWebSocket();

    // Cleanup function
    return () => {
      pythonWebSocket.disconnect();
      audioWebSocket.disconnect();
      if (emergencyTimerRef.current) {
        clearInterval(emergencyTimerRef.current);
        emergencyTimerRef.current = null;
      }
    };
  }, []);

  // Add a state to store the ID of the current fall event
  const [currentFallId, setCurrentFallId] = useState<string>("");

  const handleFallDetection = (fallData?: FallData) => {
    const currentTime = Date.now();
    const fallCooldown = 5000; // 减少到5秒冷却时间

    // 检查是否在冷却时间内
    if (currentTime - lastFallTime < fallCooldown) {
      return;
    }

    // 清除任何现有的定时器，防止重复保存
    if (emergencyTimerRef.current) {
      clearInterval(emergencyTimerRef.current);
      emergencyTimerRef.current = null;
    }

    // 重置紧急处理标志
    isEmergencyHandlingRef.current = false;

    // 如果当前有活跃的摔倒事件，检查是否应该更新
    if (isFallDetected) {
      // 如果新的检测置信度更高，允许更新
      if (fallData && fallData.confidence > 0.9) {
        // 重置当前事件
        setIsEmergencyModalVisible(false);
      } else {
        return;
      }
    }

    setLastFallTime(currentTime);
    setIsFallDetected(true);
    setIsEmergencyModalVisible(true);

    // If there is fall data, save the fall ID
    if (fallData && fallData.fallId) {
      setCurrentFallId(fallData.fallId);
    }

    // 更新连续摔倒计数
    if (fallData && fallData.consecutive_falls) {
      setConsecutiveFalls(fallData.consecutive_falls);
    }

    // Start 60-second emergency countdown
    setEmergencyCountdown(10);
    emergencyTimerRef.current = window.setInterval(() => {
      setEmergencyCountdown((prev) => {
        if (prev <= 1) {
          // When the emergency countdown ends, save as emergency event
          if (emergencyTimerRef.current) {
            clearInterval(emergencyTimerRef.current);
            emergencyTimerRef.current = null;
          }
          // 使用标志防止重复处理
          if (!isEmergencyHandlingRef.current) {
            isEmergencyHandlingRef.current = true;
            // 立即调用处理函数，不等待状态更新
            setTimeout(() => {
              handleEmergencyEvent();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 处理紧急事件（60秒无交互）
  const handleEmergencyEvent = async () => {
    try {
      // 保存为紧急事件 (eventType = 2 for emergency)
      await saveEvent(2);
      message.error("紧急跌倒事件发生，已上报联系人");

      // 重置所有状态
      setIsEmergencyModalVisible(false);
      setIsFallDetected(false);
      setUserResponse("");
      setAiResponse("");
      setEmergencyCountdown(60);
      setCurrentFallId("");
      setConsecutiveFalls(0);
      isEmergencyHandlingRef.current = false;

      // 清理定时器
      if (emergencyTimerRef.current) {
        clearInterval(emergencyTimerRef.current);
        emergencyTimerRef.current = null;
      }
    } catch (error) {
      console.error("保存紧急事件失败:", error);
      message.error("保存事件失败");
      // 确保在错误情况下也重置标志
      isEmergencyHandlingRef.current = false;
    }
  };

  // 保存事件到后端
  const saveEvent = async (eventType: number) => {
    try {
      await fallApi.saveEvent(
        currentFallId || `event-${Date.now()}`,
        eventType
      );
      message.success("事件已保存");
    } catch (error) {
      console.error("保存事件失败:", error);
      message.error("保存事件失败");
    }
  };

  // 停止60秒倒计时
  const stopEmergencyCountdown = () => {
    if (emergencyTimerRef.current) {
      clearInterval(emergencyTimerRef.current);
      emergencyTimerRef.current = null;
    }
  };

  // 停止倒计时并隐藏倒计时文字
  const stopCountdownAndHide = () => {
    stopEmergencyCountdown();
    setEmergencyCountdown(0); // 设置为0来隐藏倒计时文字
  };

  // 录音相关函数
  const handleStartRecording = async () => {
    try {
      // 设置转录更新回调
      audioRecorderService.onTranscriptionUpdate((text) => {
        setUserResponse(text);
      });

      // 设置录音完成回调
      audioRecorderService.onRecordingComplete(() => {
        setIsAssessing(true);

        // 等待一段时间让最后的音频片段处理完成
        setTimeout(() => {
          setIsAssessing(false);
          if (!userResponse.trim()) {
            // 如果没有转写结果，提供模拟结果
            setUserResponse(
              "这是模拟的语音转写结果。用户说：我摔倒了，但是我可以站起来，我的右脚踝有点疼。"
            );
            message.warning("使用模拟转写结果");
          }
        }, 2000);
      });

      await audioRecorderService.startRecording();
      setUserResponse(""); // 清空之前的转写结果
      message.info("开始录音...");
    } catch (error) {
      console.error("Failed to start recording:", error);
      message.error(
        "Failed to start recording. Please check the permission settings"
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      await audioRecorderService.stopRecording();
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  const handleConfirmOk = () => {
    // 重置所有状态
    setIsFallDetected(false);
    setIsEmergencyModalVisible(false);
    setUserResponse("");
    setAiResponse("");
    setEmergencyCountdown(60);
    setCurrentFallId("");
    setConsecutiveFalls(0);
    isEmergencyHandlingRef.current = false;

    // 清理定时器
    if (emergencyTimerRef.current) {
      clearInterval(emergencyTimerRef.current);
      emergencyTimerRef.current = null;
    }

    // 清理录音服务
    audioRecorderService.cleanup();
  };

  return (
    <div>
      <Title level={2}>Real-time Monitoring</Title>

      {isFallDetected && (
        <Alert
          message="Fall detection event detected!"
          description="The system has detected a possible fall event. Please confirm your status."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Monitoring Screen" bordered={false}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                background: "#000",
              }}
            >
              <img
                ref={videoRef}
                src="http://localhost:5000/video_feed"
                alt="Camera feed"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {isFallDetected && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "4px solid red",
                    boxSizing: "border-box",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="Status Information"
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <p>
              <strong>Monitoring Status:</strong>{" "}
              {isFallDetected ? "Fall detected!" : "Normal"}
            </p>
            <p>
              <strong>Camera:</strong> Connected
            </p>
            <p>
              <strong>Microphone:</strong> Connected
            </p>
            <p>
              <strong>AI Analysis:</strong> Enabled
            </p>
            {consecutiveFalls > 0 && (
              <p>
                <strong>Continuous Falls:</strong> {consecutiveFalls} times
              </p>
            )}
          </Card>

          <Card title="Operations" bordered={false}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                block
                onClick={() => {
                  message.info("Camera reconnected successfully");
                }}
              >
                Reconnect Camera
              </Button>
              <Button
                type="primary"
                danger
                block
                onClick={() => {
                  // Simulate a fall detection result
                  const mockFallData: FallData = {
                    isFallDetected: true,
                    confidence: 0.85,
                    boundingBox: {
                      x: 120,
                      y: 150,
                      width: 200,
                      height: 300,
                    },
                    timestamp: Date.now(),
                    fallId: `mock-fall-${Date.now()}`,
                  };

                  // Call the handling function
                  handleFallDetection(mockFallData);
                  message.warning("Fall event simulated. Confidence: 85%");
                }}
              >
                Simulate Fall Event
              </Button>
              <Button
                type="default"
                block
                onClick={() => {
                  message.info(
                    `Python: ${
                      pythonWebSocket.isConnected ? "Connected" : "Disconnected"
                    }, Audio: ${
                      audioWebSocket.isConnected ? "Connected" : "Disconnected"
                    }`
                  );
                }}
              >
                Check WebSocket Status
              </Button>
              <Button
                type="default"
                block
                onClick={() => {
                  pythonWebSocket.startDetection();
                  message.info("Manual detection start triggered");
                }}
              >
                Start Detection Manually
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div
            style={{
              padding: "0 20px 0 0",
              color: "red",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Fall detected!</span>
            {emergencyCountdown > 0 && (
              <div style={{ textAlign: "right" }}>
                {/* <div
                  style={{ color: emergencyCountdown <= 10 ? "red" : "orange" }}
                >
                  Emergency countdown: {emergencyCountdown}s
                </div> */}
                {notifyEmergency && (
                  <div>
                    <div>If no action is taken, emergency alert</div>
                    <div>{`will be triggered in ${emergencyCountdown} seconds.`}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        open={isEmergencyModalVisible}
        onOk={async () => {
          // 用户点击"I'm okay"，保存为eventType=1
          stopCountdownAndHide();
          await saveEvent(1);
          handleConfirmOk();
        }}
        onCancel={async () => {
          // 用户点击"Confirm"，保存为eventType=0
          stopCountdownAndHide();
          await saveEvent(0);
          handleConfirmOk();
        }}
        okText="I'm okay. Cancel the alert"
        cancelText="Confirm"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>
            Please describe your situation, or tell us your status using your
            voice:
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <TextArea
            rows={4}
            value={userResponse}
            onChange={(e) => {
              setUserResponse(e.target.value);
              // 停止60秒倒计时
              stopCountdownAndHide();
            }}
            placeholder="For example: I fell down, but I can stand up. My right ankle hurts a bit..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={() => {
                // 停止60秒倒计时
                stopCountdownAndHide();
                if (audioRecorderService.isRecording) {
                  handleStopRecording();
                } else {
                  handleStartRecording();
                }
              }}
              danger={audioRecorderService.isRecording}
            >
              {audioRecorderService.isRecording
                ? "Stop Recording"
                : "Start Voice Description"}
            </Button>
            <Button
              type="primary"
              loading={isAssessing}
              onClick={async () => {
                if (!userResponse) return;

                // 停止60秒倒计时
                stopCountdownAndHide();

                setIsAssessing(true);
                setAiResponse(""); // 清空之前的AI响应

                // If there is a fall ID, send the user response
                if (currentFallId) {
                  pythonWebSocket.send({
                    type: "user_response",
                    fallId: currentFallId,
                    response: userResponse,
                    timestamp: Date.now(),
                  });
                }

                try {
                  // 构建发送给AI的消息，包含用户描述和上下文
                  const aiMessage = `用户描述：${userResponse}\n\n请根据用户的描述分析其受伤情况，并提供相应的建议和注意事项。请用中文回答。`;

                  // 使用 streamChat 发送消息到AI
                  await streamChat(
                    aiMessage,
                    currentFallId || `session-${Date.now()}`,
                    (token: string) => {
                      // 实时显示AI响应的每个token
                      setAiResponse((prev) => prev + token);
                    },
                    () => {
                      // AI响应完成
                      setIsAssessing(false);
                      message.success("AI分析完成");
                    },
                    (error: string) => {
                      // 处理错误
                      console.error("AI分析失败:", error);
                      setAiResponse("AI分析服务暂时不可用，请稍后重试。");
                      setIsAssessing(false);
                      message.error("AI分析失败");
                    }
                  );
                } catch (error) {
                  console.error("发送消息到AI失败:", error);
                  setAiResponse("AI分析服务暂时不可用，请稍后重试。");
                  setIsAssessing(false);
                  message.error("AI分析失败");
                }
              }}
            >
              Analyze Response
            </Button>
          </Space>
        </div>

        {aiResponse && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>AI Analysis:</Text>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                // background: "#f6f6f6",
                borderRadius: 4,
              }}
            >
              {aiResponse}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Monitoring;
