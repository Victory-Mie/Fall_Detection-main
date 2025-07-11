import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Badge,
  Spin,
  Typography,
  Space,
  Alert,
} from "antd";
import {
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  DatabaseOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { userApi, fallApi, chatApi, settingsApi } from "../services/api";
import AuthStatus from "../components/auth/AuthStatus";

const { Title, Text } = Typography;

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  data?: any;
}

const TestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testMessage, setTestMessage] = useState(
    "Hello, this is a test message"
  );

  const addTestResult = (
    name: string,
    status: "success" | "error",
    message: string,
    data?: any
  ) => {
    setTestResults((prev) => [...prev, { name, status, message, data }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // 测试用户 API
      await testUserApi();

      // 测试事件 API
      await testEventApi();

      // 测试聊天 API
      await testChatApi();

      // 测试设置 API
      await testSettingsApi();
    } catch (error) {
      console.error("Test execution error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const testUserApi = async () => {
    try {
      // 测试用户登录
      addTestResult("用户登录", "pending", "正在测试...");
      const loginResponse = await userApi.login("testuser", "testpass");
      addTestResult("用户登录", "success", "登录成功", loginResponse.data);
    } catch (error: any) {
      addTestResult("用户登录", "error", `登录失败: ${error.message}`);
    }

    try {
      // 测试获取用户信息
      addTestResult("获取用户信息", "pending", "正在测试...");
      const userInfoResponse = await userApi.getUserInfo();
      addTestResult(
        "获取用户信息",
        "success",
        "获取成功",
        userInfoResponse.data
      );
    } catch (error: any) {
      addTestResult("获取用户信息", "error", `获取失败: ${error.message}`);
    }
  };

  const testEventApi = async () => {
    try {
      // 测试获取事件列表
      addTestResult("获取事件列表", "pending", "正在测试...");
      const eventsResponse = await fallApi.getEvents();
      addTestResult("获取事件列表", "success", "获取成功", eventsResponse.data);
    } catch (error: any) {
      addTestResult("获取事件列表", "error", `获取失败: ${error.message}`);
    }
  };

  const testChatApi = async () => {
    try {
      // 测试聊天流式响应
      addTestResult("聊天流式响应", "pending", "正在测试...");
      const chatResponse = await chatApi.streamChatJson(
        testMessage,
        "test-session"
      );

      if (chatResponse.ok) {
        addTestResult("聊天流式响应", "success", "连接成功，可以接收流式数据");
      } else {
        addTestResult(
          "聊天流式响应",
          "error",
          `连接失败: ${chatResponse.status}`
        );
      }
    } catch (error: any) {
      addTestResult("聊天流式响应", "error", `测试失败: ${error.message}`);
    }
  };

  const testSettingsApi = async () => {
    try {
      // 测试获取设置
      addTestResult("获取设置", "pending", "正在测试...");
      const settingsResponse = await settingsApi.getSettings();
      addTestResult("获取设置", "success", "获取成功", settingsResponse.data);
    } catch (error: any) {
      addTestResult("获取设置", "error", `获取失败: ${error.message}`);
    }
  };

  const testSingleApi = async (
    apiName: string,
    testFunction: () => Promise<any>
  ) => {
    try {
      addTestResult(apiName, "pending", "正在测试...");
      const result = await testFunction();
      addTestResult(apiName, "success", "测试成功", result.data);
    } catch (error: any) {
      addTestResult(apiName, "error", `测试失败: ${error.message}`);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "16px" }} />
        );
      case "error":
        return (
          <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: "16px" }} />
        );
      default:
        return (
          <LoadingOutlined
            style={{ color: "#1890ff", fontSize: "16px" }}
            spin
          />
        );
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge status="success" text="成功" />;
      case "error":
        return <Badge status="error" text="失败" />;
      default:
        return <Badge status="processing" text="测试中" />;
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <Title
            level={2}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ExperimentOutlined style={{ fontSize: "32px" }} />
            Java 后端 API 测试
          </Title>
          <Text type="secondary">
            测试前端与 Java Spring Boot 后端的连接和 API 功能
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            onClick={runAllTests}
            disabled={isRunning}
            icon={isRunning ? <Spin /> : <ExperimentOutlined />}
          >
            {isRunning ? "测试中..." : "运行所有测试"}
          </Button>

          <Button onClick={clearResults} disabled={isRunning}>
            清空结果
          </Button>
        </Space>
      </div>

      {/* 认证状态组件 */}
      <AuthStatus />

      <Alert
        message="认证状态"
        description={
          <div>
            <p>• 当前登录状态: 请查看浏览器控制台了解详细认证信息</p>
            <p>• Token 状态: 检查 localStorage 中的 auth-storage</p>
            <p>• API 调用: 查看网络请求的 Authorization header</p>
          </div>
        }
        type="info"
        style={{ marginBottom: "24px" }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* 测试控制面板 */}
        <Card
          title={
            <span>
              <SettingOutlined style={{ marginRight: "8px" }} />
              测试控制
            </span>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>测试消息</Text>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="输入测试消息"
                style={{ marginTop: "8px" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <Button
                onClick={() =>
                  testSingleApi("用户登录", () =>
                    userApi.login("testuser", "testpass")
                  )
                }
                disabled={isRunning}
                icon={<UserOutlined />}
                size="small"
              >
                用户登录
              </Button>

              <Button
                onClick={() =>
                  testSingleApi("获取事件", () => fallApi.getEvents())
                }
                disabled={isRunning}
                icon={<DatabaseOutlined />}
                size="small"
              >
                获取事件
              </Button>

              <Button
                onClick={() =>
                  testSingleApi("聊天测试", () =>
                    chatApi.streamChatJson(testMessage, "test-session")
                  )
                }
                disabled={isRunning}
                icon={<MessageOutlined />}
                size="small"
              >
                聊天测试
              </Button>

              <Button
                onClick={() =>
                  testSingleApi("获取设置", () => settingsApi.getSettings())
                }
                disabled={isRunning}
                icon={<SettingOutlined />}
                size="small"
              >
                获取设置
              </Button>
            </div>

            <div style={{ fontSize: "12px", color: "#666" }}>
              <p>• 后端地址: http://localhost:8081</p>
              <p>• API 前缀: /api</p>
              <p>• 支持 SSE 流式响应</p>
            </div>
          </Space>
        </Card>

        {/* 测试结果 */}
        <Card
          title={
            <span>
              <ExperimentOutlined style={{ marginRight: "8px" }} />
              测试结果
              <Badge count={testResults.length} style={{ marginLeft: "8px" }} />
            </span>
          }
        >
          {testResults.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "32px", color: "#666" }}
            >
              <ExperimentOutlined
                style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}
              />
              <p>暂无测试结果</p>
              <p style={{ fontSize: "12px" }}>点击"运行所有测试"开始测试</p>
            </div>
          ) : (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "6px",
                    }}
                  >
                    {getStatusIcon(result.status)}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <Text strong style={{ fontSize: "14px" }}>
                          {result.name}
                        </Text>
                        {getStatusBadge(result.status)}
                      </div>

                      <Text
                        type="secondary"
                        style={{ fontSize: "12px", marginBottom: "8px" }}
                      >
                        {result.message}
                      </Text>

                      {result.data && (
                        <details style={{ fontSize: "12px" }}>
                          <summary
                            style={{ cursor: "pointer", color: "#1890ff" }}
                          >
                            查看响应数据
                          </summary>
                          <pre
                            style={{
                              marginTop: "8px",
                              padding: "8px",
                              backgroundColor: "#f5f5f5",
                              borderRadius: "4px",
                              fontSize: "12px",
                              overflowX: "auto",
                            }}
                          >
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </Space>
            </div>
          )}
        </Card>
      </div>

      {/* 连接状态 */}
      <Card title="连接状态">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#52c41a",
                borderRadius: "50%",
              }}
            ></div>
            <div>
              <Text strong>Java 后端</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                localhost:8081
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#52c41a",
                borderRadius: "50%",
              }}
            ></div>
            <div>
              <Text strong>Python 后端</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                localhost:5000
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#52c41a",
                borderRadius: "50%",
              }}
            ></div>
            <div>
              <Text strong>前端服务</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                localhost:3000
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestPage;
