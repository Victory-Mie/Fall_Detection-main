import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/lib/locale/zh_CN";
import { useThemeStore } from "./store/themeStore";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import TestPage from "./pages/TestPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import AIAssistant from "./components/assistant/AIAssistant";
import { NotificationProvider } from "./components/notification/NotificationProvider";
import { useEffect } from "react";
import { userApi } from "./services/api";

function App() {
  const { isAuthenticated, token, logout } = useAuthStore();
  const { theme } = useThemeStore();

  // 应用启动时验证token有效性
  useEffect(() => {
    const validateToken = async () => {
      if (token && isAuthenticated) {
        try {
          // 尝试获取用户信息来验证token
          await userApi.getUserInfo();
        } catch (error) {
          console.log("Token validation failed, logging out...");
          // token无效，清除认证状态
          logout();
        }
      }
    };

    validateToken();
  }, [token, isAuthenticated, logout]);

  // 根据主题设置确定当前主题模式
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <NotificationProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="history" element={<History />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/test" element={<TestPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </Router>
      </NotificationProvider>
    </ConfigProvider>
  );
}

export default App;
