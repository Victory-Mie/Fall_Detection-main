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
import { pythonWebSocket } from "../services/websocket";
import { fallApi, streamChat } from "../services/api";
import { XfVoiceDictation } from "@muguilin/xf-voice-dictation";

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
  const modalVisibleRef = useRef(false);
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
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cameraStatus, setCameraStatus] = useState<
    "Connected" | "Disconnected"
  >("Connected");
  const [micStatus, setMicStatus] = useState<"Connected" | "Disconnected">(
    "Disconnected"
  );

  // 讯飞语音听写实例
  const xfVoiceRef = useRef<any>(null);
  const timesRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingRequest, setIsRecordingRequest] = useState(false);

  // 初始化讯飞听写（只初始化一次）
  useEffect(() => {
    xfVoiceRef.current = new XfVoiceDictation({
      APPID: "24f97b6a",
      APISecret: "ZWQ1MWY0MGRkMzRlY2U1NDc4MmY3MjEw",
      APIKey: "d0f2da9d3b24eb1d50911d2e9b359b77",
      onWillStatusChange: function (oldStatus: string, newStatus: string) {
        if (newStatus === "ing") {
          setIsRecording(true);
          setIsRecordingRequest(false);
        } else if (newStatus === "end" || newStatus === "init") {
          setIsRecording(false);
          setIsRecordingRequest(false);
        }
        console.log("Recognition status:", oldStatus, newStatus);
      },
      onTextChange: function (text: string) {
        setUserResponse(text);
        if (text) {
          clearTimeout(timesRef.current);
          timesRef.current = setTimeout(() => {
            xfVoiceRef.current && xfVoiceRef.current.stop();
          }, 3000);
        }
      },
      onError: function (error: any) {
        message.error(
          "iFlytek speech recognition error: " + error.message || error
        );
        console.log("Error info:", error);
      },
    });
    return () => {
      if (xfVoiceRef.current) xfVoiceRef.current.stop();
      clearTimeout(timesRef.current);
    };
  }, []);

  // 每次弹窗状态变化时，同步ref
  useEffect(() => {
    modalVisibleRef.current = isEmergencyModalVisible;
  }, [isEmergencyModalVisible]);

  // Connect to Python WebSocket service
  useEffect(() => {
    pythonWebSocket.connect();
    pythonWebSocket.setFallDetectionCallback((fallData) => {
      if (modalVisibleRef.current) return; // 用ref判断
      if (isFallDetected) return;
      handleFallDetection({
        isFallDetected: true,
        confidence: fallData.confidence,
        timestamp: Date.now(),
        fallId: fallData.fall_id,
        imageUrl: fallData.image_path,
      });
    });
    setTimeout(() => {
      pythonWebSocket.startDetection();
      message.info("Fall detection has been started");
    }, 2000);
    return () => {
      pythonWebSocket.disconnect();
      if (emergencyTimerRef.current) {
        clearInterval(emergencyTimerRef.current);
        emergencyTimerRef.current = null;
      }
    };
  }, []);

  // Add a state to store the ID of the current fall event
  const [currentFallId, setCurrentFallId] = useState<string>("");

  // 播放警示音
  const playAlertSound = () => {
    console.log("playAlertSound");
    const audio = new Audio("alert.mp3");
    audio.play();
  };

  const handleFallDetection = (fallData?: FallData & { imageUrl?: string }) => {
    if (modalVisibleRef.current) return;
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

    // 播放警示音
    playAlertSound();

    // If there is fall data, save the fall ID
    if (fallData && fallData.fallId) {
      setCurrentFallId(fallData.fallId);
    }

    // 更新连续摔倒计数
    if (fallData && fallData.consecutive_falls) {
      setConsecutiveFalls(fallData.consecutive_falls);
    }

    // 新增：保存图片URL
    if (fallData && fallData.imageUrl) {
      setImageUrl(fallData.imageUrl);
    }

    // Start 60-second emergency countdown
    setEmergencyCountdown(60);
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
      message.error("Emergency fall event occurred, contact has been notified");

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
      console.error("Failed to save emergency event:", error);
      message.error("Failed to save event");
      // 确保在错误情况下也重置标志
      isEmergencyHandlingRef.current = false;
    }
  };

  // 保存事件到后端
  const saveEvent = async (eventType: number) => {
    try {
      await fallApi.saveEvent(
        currentFallId || `event-${Date.now()}`,
        eventType,
        imageUrl // 新增：传递图片URL
      );
      message.success("Event saved");
    } catch (error) {
      console.error("Failed to save event:", error);
      message.error("Failed to save event");
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
    // audioRecorderService.cleanup(); // This line is removed as per the edit hint
  };

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setMicStatus("Connected"))
      .catch(() => setMicStatus("Disconnected"));
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
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
                onLoad={() => setCameraStatus("Connected")}
                onError={() => setCameraStatus("Disconnected")}
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
              <strong>Camera:</strong> {cameraStatus}
            </p>
            <p>
              <strong>Microphone:</strong> {micStatus}
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
        closable={false}
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
                stopCountdownAndHide();
                if (isRecording || isRecordingRequest) {
                  xfVoiceRef.current && xfVoiceRef.current.stop();
                  setIsRecordingRequest(false);
                } else if (xfVoiceRef.current) {
                  setUserResponse("");
                  xfVoiceRef.current.start();
                  setIsRecordingRequest(true);
                }
              }}
              danger={isRecording || isRecordingRequest}
            >
              {isRecording || isRecordingRequest
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
                  const aiMessage = `User description: ${userResponse}\n\nPlease analyze the user's injury based on the description and provide relevant advice and precautions. Please answer in the user's language, keep the answer concise, and do not exceed 100 words.`;

                  // 使用 streamChat 发送消息到AI
                  await streamChat(
                    aiMessage,
                    currentFallId || `session-${Date.now()}`,
                    (token: string) => {
                      // 实时显示AI响应的每个token
                      setAiResponse((prev) => prev + token);
                    },
                    () => {
                      // AI response completed
                      setIsAssessing(false);
                      message.success("AI analysis completed");
                    },
                    (error: string) => {
                      // Handle error
                      console.error("AI analysis failed:", error);
                      setAiResponse(
                        "AI analysis service is temporarily unavailable, please try again later."
                      );
                      setIsAssessing(false);
                      message.error("AI analysis failed");
                    }
                  );
                } catch (error) {
                  console.error("Failed to send message to AI:", error);
                  setAiResponse(
                    "AI analysis service is temporarily unavailable, please try again later."
                  );
                  setIsAssessing(false);
                  message.error("AI analysis failed");
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
        {/* 新增：显示摔倒截图 */}
        {imageUrl && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <img
              src={`http://localhost:5000${imageUrl}`}
              alt="Fall Screenshot"
              style={{
                maxWidth: 400,
                maxHeight: 300,
                border: "2px solid #f5222d",
                borderRadius: 8,
              }}
            />
            <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
              Fall Screenshot
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Monitoring;
