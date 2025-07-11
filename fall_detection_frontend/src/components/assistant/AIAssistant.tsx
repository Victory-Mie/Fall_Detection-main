import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Modal,
  Input,
  List,
  Typography,
  Avatar,
  theme,
  Spin,
} from "antd";
import {
  UserOutlined,
  RobotOutlined,
  SendOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useThemeStore } from "../../store/themeStore";
import "./AIAssistant.css";

const AIAssistant = () => {
  const [visible, setVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: "Hello! I'm your AI assistant. How can I help you?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { theme: themeMode } = useThemeStore();
  const { token } = theme.useToken();

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // 添加用户消息
    setMessages((prev) => [...prev, { type: "user", content: inputValue }]);

    // 显示AI正在输入状态
    setIsTyping(true);

    // 模拟AI回复（添加延迟以模拟真实对话）
    setTimeout(() => {
      const aiResponses = [
        "I'm here to help with your health monitoring needs. How are you feeling today?",
        "I can provide information about fall detection and prevention. What would you like to know?",
        "If you're experiencing any discomfort, I can suggest some basic care instructions.",
        "Remember to keep your emergency contact information up to date in the settings.",
      ];
      const aiResponse =
        aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setMessages((prev) => [...prev, { type: "ai", content: aiResponse }]);
      setIsTyping(false);
    }, 1500);

    setInputValue("");
  };

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]); // 每次消息更新或输入状态变化时执行

  // 当对话框打开时，聚焦到输入框
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [visible]);

  return (
    <>
      {/* 右下角悬浮按钮 */}
      <Button
        className="assistant-button"
        shape="circle"
        icon={<RobotOutlined />}
        size="large"
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          width: 60,
          height: 60,
          fontSize: "24px",
          backgroundColor: token.colorPrimary,
          color: "#fff",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "none",
          transition: "all 0.3s ease",
        }}
        onClick={() => setVisible(true)}
      />

      {/* 对话框 */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Avatar
                icon={<RobotOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  marginRight: 10,
                }}
              />
              <span>AI Health Assistant</span>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setVisible(false)}
              style={{ marginRight: -10 }}
            />
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={400}
        className="assistant-modal"
        maskStyle={{ backdropFilter: "blur(2px)" }}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
        }}
        closeIcon={null}
      >
        {/* 消息区域 - 固定高度 + 局部滚动 */}
        <div
          className="message-container"
          style={{
            height: "350px",
            overflowY: "auto",
            marginBottom: "15px",
            padding: "16px",
            backgroundColor: token.colorBgContainer,
            borderRadius: "12px",
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item
                key={item.content}
                className={`message-item ${
                  item.type === "user" ? "user-message" : "ai-message"
                }`}
                style={{
                  display: "flex",
                  justifyContent:
                    item.type === "user" ? "flex-end" : "flex-start",
                  padding: "8px 0",
                  border: "none",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                {item.type === "ai" && (
                  <>
                    <Avatar
                      size={36}
                      icon={<RobotOutlined />}
                      style={{
                        backgroundColor: token.colorPrimary,
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    />
                    <Typography.Text
                      className="message-bubble ai-bubble"
                      style={{
                        backgroundColor:
                          themeMode === "dark"
                            ? "rgba(64, 87, 109, 0.8)"
                            : "rgba(240, 247, 255, 0.9)",
                        color: token.colorText,
                        margin: "0 10px",
                        padding: "10px 16px",
                        borderRadius: "18px 18px 18px 4px",
                        maxWidth: "75%",
                        wordBreak: "break-word",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                        textAlign: "left",
                        position: "relative",
                        lineHeight: "1.5",
                      }}
                    >
                      {item.content}
                    </Typography.Text>
                  </>
                )}
                {item.type === "user" && (
                  <>
                    <Typography.Text
                      className="message-bubble user-bubble"
                      style={{
                        backgroundColor: token.colorPrimary,
                        color: "#fff",
                        margin: "0 10px",
                        padding: "10px 16px",
                        borderRadius: "18px 18px 4px 18px",
                        maxWidth: "75%",
                        wordBreak: "break-word",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                        textAlign: "left",
                        position: "relative",
                        lineHeight: "1.5",
                      }}
                    >
                      {item.content}
                    </Typography.Text>
                    <Avatar
                      size={36}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: "#87d068",
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    />
                  </>
                )}
              </List.Item>
            )}
          />
          {/* AI正在输入的指示器 */}
          {isTyping && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "8px 0",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <Avatar
                size={36}
                icon={<RobotOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  backgroundColor:
                    themeMode === "dark"
                      ? "rgba(64, 87, 109, 0.8)"
                      : "rgba(240, 247, 255, 0.9)",
                  borderRadius: "18px 18px 18px 4px",
                  padding: "12px 16px",
                  marginLeft: "10px",
                  display: "inline-block",
                }}
              >
                <Spin size="small" />
                <span style={{ marginLeft: 10 }}>Typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* 滚动目标 */}
        </div>

        {/* 输入框与发送按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            position: "relative",
          }}
        >
          <Input.TextArea
            ref={inputRef}
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question here..."
            style={{
              borderRadius: "12px",
              resize: "none",
              padding: "10px 14px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              transition: "all 0.3s ease",
            }}
            disabled={isTyping}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSend}
            style={{
              width: "46px",
              height: "46px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              transition: "all 0.3s ease",
            }}
            disabled={!inputValue.trim() || isTyping}
          />
        </div>
      </Modal>
    </>
  );
};

export default AIAssistant;
