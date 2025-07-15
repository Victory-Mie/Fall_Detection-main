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
      message.success("Login test successful");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, login: { error: error.message } }));
      message.error(`Login test failed: ${error.message}`);
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
      message.success("Registration test successful");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, register: { error: error.message } }));
      message.error(`Registration test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetUserInfo = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserInfo();
      setResults((prev) => ({ ...prev, userInfo: response.data }));
      message.success("Get user info test successful");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, userInfo: { error: error.message } }));
      message.error(`Get user info test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetEvents = async () => {
    setLoading(true);
    try {
      const response = await fallApi.getEvents();
      setResults((prev) => ({ ...prev, events: response.data }));
      message.success("Get event list test successful");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, events: { error: error.message } }));
      message.error(`Get event list test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testChatHistory = async () => {
    setLoading(true);
    try {
      const response = await chatApi.getHistory("test-session");
      setResults((prev) => ({ ...prev, chatHistory: response.data }));
      message.success("Get chat history test successful");
    } catch (error: any) {
      setResults((prev) => ({
        ...prev,
        chatHistory: { error: error.message },
      }));
      message.error(`Get chat history test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testAudioProcess = async () => {
    setLoading(true);
    try {
      const response = await audioApi.processAudio("test-audio-data", "wav");
      setResults((prev) => ({ ...prev, audio: response.data }));
      message.success("Audio process test successful");
    } catch (error: any) {
      setResults((prev) => ({ ...prev, audio: { error: error.message } }));
      message.error(`Audio process test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Java Backend Connection Test</Title>
      <Text type="secondary">Test frontend connection to Java Spring Boot backend</Text>

      <Card title="API Test" style={{ marginTop: "20px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space wrap>
            <Button type="primary" onClick={testUserLogin} loading={loading}>
              Test User Login
            </Button>
            <Button type="primary" onClick={testUserRegister} loading={loading}>
              Test User Registration
            </Button>
            <Button type="primary" onClick={testGetUserInfo} loading={loading}>
              Test Get User Info
            </Button>
            <Button type="primary" onClick={testGetEvents} loading={loading}>
              Test Get Event List
            </Button>
            <Button type="primary" onClick={testChatHistory} loading={loading}>
              Test Get Chat History
            </Button>
            <Button type="primary" onClick={testAudioProcess} loading={loading}>
              Test Audio Processing
            </Button>
          </Space>
        </Space>
      </Card>

      <Card title="Test Results" style={{ marginTop: "20px" }}>
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
