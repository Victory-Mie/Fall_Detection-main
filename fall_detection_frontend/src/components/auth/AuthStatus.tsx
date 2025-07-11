import React from 'react';
import { Card, Typography, Tag, Space, Button } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Text, Title } = Typography;

const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!isAuthenticated) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              认证状态
            </Title>
            <Tag color="red">未登录</Tag>
          </div>
          <Text type="secondary">请先登录以访问完整功能</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            认证状态
          </Title>
          <Tag color="green">已登录</Tag>
        </div>
        
        <div>
          <Text strong>用户: </Text>
          <Text>{user?.username}</Text>
        </div>
        
        <div>
          <Text strong>邮箱: </Text>
          <Text>{user?.email}</Text>
        </div>
        
        <div>
          <Text strong>Token: </Text>
          <Text code style={{ fontSize: '12px' }}>
            {token ? `${token.substring(0, 10)}...` : '无'}
          </Text>
        </div>
        
        <Button 
          type="primary" 
          danger 
          size="small" 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </Space>
    </Card>
  );
};

export default AuthStatus;
