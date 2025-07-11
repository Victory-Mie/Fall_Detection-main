import { useState, useEffect } from "react";
import { Layout, Menu, Button, theme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  VideoCameraOutlined,
  HistoryOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  AlertFilled,
  UserOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { theme: themeMode } = useThemeStore();

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // 当系统主题变化且用户设置为跟随系统时，强制重新渲染
      if (themeMode === "system") {
        // 强制组件重新渲染
        forceUpdate();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // 强制重新渲染的辅助函数
  const [, forceUpdate] = useState({});

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "Home",
    },
    {
      key: "/monitoring",
      icon: <VideoCameraOutlined />,
      label: "Monitoring",
    },
    {
      key: "/history",
      icon: <HistoryOutlined />,
      label: "History",
    },
    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", width: "100vw" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start", // 根据折叠状态调整对齐方式
            fontSize: 20,
            fontWeight: "bold",
            color: "#fff",
            visibility: collapsed ? "hidden" : "visible", // 折叠时隐藏内容但保留空间
          }}
        >
          <AlertFilled style={{ marginRight: 8 }} />
          {!collapsed && "Community Guardian"} {/* 未折叠时显示文字 */}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <div style={{ flex: 1 }}>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              fontSize: "16px",
              float: "right",
              margin: "16px 24px",
            }}
          >
            Logout
          </Button>
        </Header>
        <Content
          style={{
            // margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            // borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </div>
    </div>
  );
};

export default MainLayout;
