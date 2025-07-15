import React from "react";
import { Card, Typography, Tag, Space, Button } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";

const { Text, Title } = Typography;

const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!isAuthenticated) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Authentication Status
            </Title>
            <Tag color="red">Not Logged In</Tag>
          </div>
          <Text type="secondary">Please log in to access all features</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Authentication Status
          </Title>
          <Tag color="green">Logged In</Tag>
        </div>

        <div>
          <Text strong>User: </Text>
          <Text>{user?.username}</Text>
        </div>

        <div>
          <Text strong>Email: </Text>
          <Text>{user?.email}</Text>
        </div>

        <div>
          <Text strong>Token: </Text>
          <Text code style={{ fontSize: "12px" }}>
            {token ? `${token.substring(0, 10)}...` : "None"}
          </Text>
        </div>

        <Button
          type="primary"
          danger
          size="small"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Space>
    </Card>
  );
};

export default AuthStatus;
