import React, { useState } from 'react';
import { Form, Input, Button, Card, Checkbox, App, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authAPI } from '../api';

const { Title, Paragraph } = Typography;

function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await authAPI.login({
        username: values.username.trim(),
        password: values.password
      });

      login(res.data.token, res.data.user);
      message.success('登录成功，欢迎回来！');
      setTimeout(() => navigate(from, { replace: true }), 300);
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    form.setFieldsValue({ username: 'admin', password: 'admin123', remember: true });
    message.info('已填入演示账号：admin / admin123');
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-logo">
          <div className="login-logo-icon">⚖️</div>
          <Title level={3} className="login-title">律师事务所案件管理系统</Title>
          <Paragraph className="login-subtitle">专业、高效、安全的案件全流程管理平台</Paragraph>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onSubmit}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住登录状态</Checkbox>
              </Form.Item>
              <Button type="link" size="small" onClick={fillDemoAccount}>
                <SafetyOutlined /> 使用演示账号
              </Button>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, fontSize: 16, fontWeight: 500 }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: '#666' }}>
            <div>👤 管理员: <b>admin</b> / <b>admin123</b></div>
            <div>👤 律师账号: <b>lawyer01</b> / <b>admin123</b></div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LoginPage;
