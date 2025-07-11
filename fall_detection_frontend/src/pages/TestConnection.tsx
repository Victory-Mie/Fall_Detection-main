import React, { useState } from "react";
import { Button, Card, message, Space, Typography } from "antd";
import { userApi, fallApi, chatApi, audioApi } from "../services/api";

const { Title, Text } = Typography;

const TestConnection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const testUserLogin = async () => {
    setLoading(true);
    try {
      const response = await userApi.login("testuser", "testpass");
      setResults((prev) => ({ ...prev, login: response.data }));
      message.success("登录测试成功");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, login: { error: error.message } }));
      message.error(`登录测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserRegister = async () => {
    setLoading(true);
    try {
      const response = await userApi.register(
        "newuser",
        "newuser@test.com",
        "newpass"
      );
      setResults((prev) => ({ ...prev, register: response.data }));
      message.success("注册测试成功");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, register: { error: error.message } }));
      message.error(`注册测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetUserInfo = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserInfo();
      setResults((prev) => ({ ...prev, userInfo: response.data }));
      message.success("获取用户信息测试成功");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, userInfo: { error: error.message } }));
      message.error(`获取用户信息测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetEvents = async () => {
    setLoading(true);
    try {
      const response = await fallApi.getEvents();
      setResults((prev) => ({ ...prev, events: response.data }));
      message.success("获取事件列表测试成功");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, events: { error: error.message } }));
      message.error(`获取事件列表测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testChatHistory = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getHistory("test-session");
      setResults((prev) => ({ ...prev, chatHistory: response.data }));
      message.success("获取聊天历史测试成功");
    } catch (error: any) {
      setResults((prev) => ({
        ...prev,
        chatHistory: { error: error.message },
      }));
      message.error(`获取聊天历史测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAudioProcess = async () => {
    setLoading(true);
    try {
      const response = await audioApi.processAudio("test-audio-data", "wav");
      setResults((prev) => ({ ...prev, audio: response.data }));
      message.success("音频处理测试成功");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, audio: { error: error.message } }));
      message.error(`音频处理测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Java 后端连接测试</Title>
      <Text type="secondary">测试前端与 Java Spring Boot 后端的连接</Text>

      <Card title="API 测试" style={{ marginTop: "20px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space wrap>
            <Button type="primary" onClick={testUserLogin} loading={loading}>
              测试用户登录
            </Button>
            <Button type="primary" onClick={testUserRegister} loading={loading}>
              测试用户注册
            </Button>
            <Button type="primary" onClick={testGetUserInfo} loading={loading}>
              测试获取用户信息
            </Button>
            <Button type="primary" onClick={testGetEvents} loading={loading}>
              测试获取事件列表
            </Button>
            <Button type="primary" onClick={testChatHistory} loading={loading}>
              测试获取聊天历史
            </Button>
            <Button type="primary" onClick={testAudioProcess} loading={loading}>
              测试音频处理
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="测试结果" style={{ marginTop: "20px" }}>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          {JSON.stringify(results, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default TestConnection;
