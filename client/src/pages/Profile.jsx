import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Avatar, Upload, App, Space, Row, Col,
  Descriptions, Tag, Divider, Typography, Modal, List
} from 'antd';
import {
  UserOutlined, EditOutlined, SaveOutlined, SafetyOutlined,
  CameraOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store';
import { authAPI } from '../api';
import { USER_ROLE_OPTIONS, getOptionLabel, getOptionColor } from '../utils/constants';
import { formatDateTime } from '../utils/helpers';

const { Title, Text, Paragraph } = Typography;

function ProfilePage() {
  const { user, updateUser, token } = useAuthStore();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('头像大小不能超过 2MB');
      return false;
    }
    return true;
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') return;
    if (info.file.status === 'done' || info.file.originFileObj) {
      getBase64(info.file.originFileObj, url => {
        setAvatarUrl(url);
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await authAPI.updateProfile({
        ...values,
        avatar: avatarUrl
      });
      updateUser(res.data || {});
      message.success('个人信息更新成功');
    } catch (e) {} finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.new_password !== values.confirm_password) {
        message.error('两次输入的新密码不一致');
        return;
      }
      setChangingPwd(true);
      await authAPI.updateProfile({
        old_password: values.old_password,
        new_password: values.new_password
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
      setPasswordModal(false);
    } catch (e) {} finally {
      setChangingPwd(false);
    }
  };

  const [passwordModal, setPasswordModal] = useState(false);

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title">个人中心</div>
        <div className="page-subtitle">管理您的个人信息和账户安全设置</div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            className="card-shadow"
            bodyStyle={{ textAlign: 'center', padding: '32px 16px' }}
          >
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <Avatar
                size={96}
                icon={<UserOutlined style={{ fontSize: 48 }} />}
                src={avatarUrl}
                style={{ backgroundColor: '#1890ff', border: '3px solid #e6f4ff' }}
              />
              <Upload
                name="avatar"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleAvatarChange}
                accept="image/*"
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32
                  }}
                />
              </Upload>
            </div>

            <Title level={4} style={{ marginBottom: 4 }}>{user?.real_name}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              @{user?.username}
            </Text>
            <Tag color={getOptionColor(USER_ROLE_OPTIONS, user?.role)} style={{ marginBottom: 24 }}>
              {getOptionLabel(USER_ROLE_OPTIONS, user?.role)}
            </Tag>

            <Descriptions column={1} size="small" bordered style={{ textAlign: 'left' }}>
              <Descriptions.Item label="邮箱">{user?.email || <Text type="secondary">未设置</Text>}</Descriptions.Item>
              <Descriptions.Item label="手机">{user?.phone || <Text type="secondary">未设置</Text>}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{formatDateTime(user?.created_at)}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<SafetyOutlined />}
                onClick={() => setPasswordModal(true)}
              >
                修改密码
              </Button>
              <Button
                block
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  setAvatarUrl(user?.avatar);
                  message.info('已重置为原始信息');
                }}
              >
                重置修改
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={
              <Space>
                <EditOutlined />
                <span>基本信息</span>
              </Space>
            }
            className="card-shadow"
            extra={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                保存修改
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              size="large"
              initialValues={{
                real_name: user?.real_name,
                email: user?.email,
                phone: user?.phone
              }}
              style={{ maxWidth: 600 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="username"
                    label="用户名"
                  >
                    <Input disabled prefix={<UserOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="real_name"
                    label="真实姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="电子邮箱"
                    rules={[
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input placeholder="请输入邮箱，用于接收通知" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号码"
                    rules={[
                      {
                        pattern: /^1[3-9]\d{9}$/,
                        message: '请输入有效的手机号码'
                      }
                    ]}
                  >
                    <Input placeholder="请输入手机号，用于接收短信通知" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <Space>
                <SafetyOutlined />
                <span>账户安全</span>
              </Space>
            }
            className="card-shadow"
          >
            <List
              dataSource={[
                {
                  title: '登录密码',
                  desc: '定期修改密码可以保护您的账户安全',
                  action: <Button type="link" onClick={() => setPasswordModal(true)}>修改密码</Button>
                },
                {
                  title: '邮箱绑定',
                  desc: user?.email ? `当前绑定：${user.email}` : '未绑定邮箱',
                  action: <Button type="link" disabled={!user?.email}>更换邮箱</Button>
                },
                {
                  title: '手机绑定',
                  desc: user?.phone ? `当前绑定：${user.phone}` : '未绑定手机',
                  action: <Button type="link" disabled={!user?.phone}>更换手机</Button>
                }
              ]}
              renderItem={item => (
                <List.Item actions={[item.action]}>
                  <List.Item.Meta
                    title={<Text strong>{item.title}</Text>}
                    description={<Text type="secondary">{item.desc}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="修改密码"
        open={passwordModal}
        onCancel={() => setPasswordModal(false)}
        onOk={handleChangePassword}
        okText="确认修改"
        confirmLoading={changingPwd}
        width={480}
      >
        <Form form={passwordForm} layout="vertical" size="large" style={{ marginTop: 8 }}>
          <Form.Item
            name="old_password"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码(至少6位)" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProfilePage;
