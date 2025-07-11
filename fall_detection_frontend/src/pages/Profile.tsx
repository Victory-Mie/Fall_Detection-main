import { useState, useEffect } from "react";
import { Card, Form, Input, Button, Typography, message, Spin } from "antd";
import { UserOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { userApi } from "../services/api";

const { Title } = Typography;

interface UserProfile {
  id: string | number;
  username: string;
  email: string;
  phoneNumber?: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();
  const { user, updateUser } = useAuthStore();

  // 页面初始用authStore.user兜底
  useEffect(() => {
    if (user) {
      setUserProfile({
        id: user.id,
        username: user.username,
        email: user.email,
      });
      form.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    }
    fetchUserProfile();
    // eslint-disable-next-line
  }, []);

  // 拉取后端用户信息
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserInfo();
      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        if (data.phoneNumber !== undefined && data.phoneNumber !== null) {
          data.phoneNumber = String(data.phoneNumber);
        }
        setUserProfile(data);
        form.setFieldsValue({
          username: data.username,
          email: data.email,
          phoneNumber: data.phoneNumber,
        });
        updateUser({
          username: data.username,
          email: data.email,
        });
      } else {
        message.error(response.data.errorMsg || "Failed to fetch user info");
      }
    } finally {
      setLoading(false);
    }
  };

  // 保存修改
  const handleProfileUpdate = async (values: UserProfile) => {
    setLoading(true);
    try {
      const response = await userApi.updateUserInfo({
        ...values,
        id: userProfile?.id,
        phoneNumber: values.phoneNumber
          ? String(values.phoneNumber)
          : undefined,
      });
      if (response.data && response.data.success) {
        message.success("Personal information updated successfully");
        updateUser({
          username: values.username,
          email: values.email,
        });
        fetchUserProfile();
      } else {
        message.error(response.data.errorMsg || "Update failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 24px", minHeight: "100vh" }}>
      <Spin spinning={loading}>
        <Title level={2}>Personal Center</Title>
        <Card style={{ maxWidth: 480, margin: "0 auto" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleProfileUpdate}
            initialValues={
              userProfile
                ? {
                    username: userProfile.username,
                    email: userProfile.email,
                    phoneNumber: userProfile.phoneNumber,
                  }
                : {}
            }
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: "Please enter your username" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item name="phoneNumber" label="Phone Number">
              <Input prefix={<PhoneOutlined />} placeholder="Phone Number" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default Profile;
