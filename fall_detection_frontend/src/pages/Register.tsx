import { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Spin } from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import "../styles/Auth.css";

const { Title } = Typography;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      // Call the API service to register
      const response = await userApi.register(
        values.username,
        values.email,
        values.password,
        values.phoneNumber
      );

      if (response.data.success) {
        message.success("Registration successful. Please log in.");
        navigate("/login");
      } else {
        message.error(
          response.data.message ||
            "Registration failed. Please try again later."
        );
      }
    } catch (error) {
      message.error("Registration failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated background elements */}
      <div className="bg-animation">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <Spin spinning={loading}>
        <Card className="auth-card">
          <div className="auth-header">
            <Title level={2}>Community Guardian: Fall Detection</Title>
            <Title level={4}>Join Our Caring Community</Title>
            <p>
              Create your account to be part of our community initiative that
              helps protect seniors in public spaces. Our advanced technology
              watches over community centers, parks, and shared living spaces to
              ensure the well-being of our elderly neighbors when they gather
              together.
            </p>
          </div>

          <Form
            name="register"
            className="auth-form"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please enter your username!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                {
                  type: "email",
                  message: "Please enter a valid email address!",
                },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              rules={[
                { required: true, message: "Please enter your phone number!" },
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: "Please enter a valid phone number!",
                },
              ]}
            >
              <Input prefix={<SafetyOutlined />} placeholder="Phone Number" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please enter your password!" },
                {
                  min: 6,
                  message: "Password must be at least 6 characters long!",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords you entered do not match!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-button">
                Register
              </Button>
            </Form.Item>

            <div className="auth-links">
              <span>Already have an account? </span>
              <Link to="/login">Log in now</Link>
            </div>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default Register;
