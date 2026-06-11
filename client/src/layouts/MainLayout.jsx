import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Tooltip, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuthStore, useAppStore } from '../store';
import { notificationAPI } from '../api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/cases', icon: <FileTextOutlined />, label: '案件管理' },
  { key: '/parties', icon: <TeamOutlined />, label: '当事人管理' },
  { key: '/documents', icon: <FolderOpenOutlined />, label: '卷宗管理' },
  { key: '/milestones', icon: <ClockCircleOutlined />, label: '节点追踪' },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    children: [
      { key: '/settings/rules', icon: <ExclamationCircleOutlined />, label: '提醒规则' }
    ]
  }
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { collapsed, toggleCollapsed, unreadCount, setUnreadCount } = useAppStore();
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  useEffect(() => {
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadCount(res.data?.total || 0);
    } catch (e) {}
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (path.startsWith(child.key)) return [child.key, item.key];
        }
      }
      if (path.startsWith(item.key)) return [item.key];
    }
    return ['/dashboard'];
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        try {
          await notificationAPI && true;
        } catch (e) {}
        logout();
        navigate('/login');
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{ position: 'sticky', top: 0, height: '100vh' }}
      >
        <div className="header-logo">
          <span className="header-logo-icon">⚖️</span>
          {!collapsed && <span>案件管理系统</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['/settings']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tooltip title="消息通知">
              <Badge count={unreadCount} size="small" offset={[-4, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => navigate('/notifications')}
                  style={{ fontSize: '16px', width: 44, height: 44 }}
                />
              </Badge>
            </Tooltip>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 8px' }}>
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  style={{ backgroundColor: '#1890ff' }}
                />
                {!collapsed && (
                  <span style={{ marginLeft: 8, fontSize: 14 }}>
                    {user?.real_name || user?.username}
                  </span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
