import React, { useState, useEffect } from "react";
import {
  Form,
  Switch,
  Button,
  message,
  Typography,
  Card,
  Spin,
  Divider,
  Radio,
} from "antd";
import { settingsApi } from "../services/api";
import { useThemeStore, ThemeMode } from "../store/themeStore";

const { Title } = Typography;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const {
    theme,
    setTheme,
    notificationSettings,
    updateNotificationSettings,
    notifyEmergency,
    setNotifyEmergency,
  } = useThemeStore();

  useEffect(() => {
    // Fetch settings
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await settingsApi.getSettings();
        // Merge backend settings and local theme settings
        form.setFieldsValue({
          ...response.data,
          theme: theme, // Use the locally stored theme setting
          notificationSettings: notificationSettings, // Use the locally stored notification setting
          notifyEmergency: notifyEmergency, // Use the locally stored fall event notification setting
        });
      } catch (error) {
        console.error("Failed to get the settings:", error);
        message.error("Failed to get the settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form, theme, notificationSettings]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      // Update the theme setting to local storage
      setTheme(values.theme as ThemeMode);

      // Update the notification setting to local storage
      updateNotificationSettings(values.notificationSettings);

      // Update fall event notification setting to local storage
      setNotifyEmergency(values.notifyEmergency);

      // Save other settings to the backend
      const {
        theme: _,
        notificationSettings: __,
        notifyEmergency: ___,
        ...backendSettings
      } = values;
      const response = await settingsApi.updateSettings(backendSettings);

      if (response.data.success) {
        message.success("Settings have been saved");
      } else {
        message.error(response.data.message || "Failed to save the settings");
      }
    } catch (error) {
      console.error("Failed to save the settings:", error);
      message.error("Failed to save the settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      <Spin spinning={loading}>
        <Card>
          <Title level={3}>System Settings</Title>
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Divider orientation="left">Notification Settings</Divider>
            <Form.Item
              label="Fall Event Notification"
              name="notifyEmergency"
              valuePropName="checked"
              tooltip="When enabled, if a fall is detected and the countdown time is exceeded, an emergency alert will be triggered"
            >
              <Switch />
            </Form.Item>

            <Divider orientation="left">Interface Settings</Divider>
            <Form.Item label="System Theme" name="theme">
              <Radio.Group>
                <Radio value="light">Light Mode</Radio>
                <Radio value="dark">Dark Mode</Radio>
                <Radio value="system">Follow System</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Current Theme" className="theme-preview">
              <Card size="small" style={{ width: 300, textAlign: "center" }}>
                {theme === "light" && "Currently using the light theme"}
                {theme === "dark" && "Currently using the dark theme"}
                {theme === "system" &&
                  `Currently following the system (${
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "Dark"
                      : "Light"
                  })`}
              </Card>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default Settings;
