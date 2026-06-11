import React, { useState, useEffect } from 'react';
import {
  Card, List, Button, Space, Empty, App, Tag, Input, Select,
  Avatar, Badge, Tooltip, Popconfirm, Divider, Typography, Spin, Tabs
} from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined,
  ClockCircleOutlined, FileTextOutlined, WarningOutlined,
  ExclamationCircleOutlined, CalendarOutlined, ReadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { notificationAPI } from '../../api';
import {
  NOTIFICATION_TYPE_OPTIONS, getOptionLabel, getOptionColor
} from '../../utils/constants';
import { formatDateTime, formatRelativeTime } from '../../utils/helpers';
import { useAppStore } from '../../store';

const { Title, Text } = Typography;

function NotificationPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [tab, setTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState(undefined);
  const setUnreadCount = useAppStore(s => s.setUnreadCount);

  useEffect(() => {
    fetchData();
    fetchUnreadCount();
  }, [page, tab, typeFilter]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadTotal(res.data?.total || 0);
      setUnreadCount(res.data?.total || 0);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        is_read: tab === 'unread' ? 0 : tab === 'read' ? 1 : undefined,
        type: typeFilter
      };
      const res = await notificationAPI.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (item) => {
    try {
      await notificationAPI.markRead(item.id);
      message.success('已标记为已读');
      fetchData();
      fetchUnreadCount();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      message.success('已全部标记为已读');
      fetchData();
      fetchUnreadCount();
    } catch (e) {}
  };

  const handleDelete = async (item) => {
    try {
      await notificationAPI.delete(item.id);
      message.success('删除成功');
      fetchData();
      fetchUnreadCount();
    } catch (e) {}
  };

  const handleClick = (item) => {
    if (!item.is_read) handleMarkRead(item);
    if (item.related_type === 'case' && item.related_id) {
      navigate(`/cases/${item.related_id}`);
    } else if (item.related_type === 'milestone' && item.related_id) {
      navigate('/milestones');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline_overdue':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'deadline_warning':
        return <WarningOutlined style={{ color: '#fa8c16', fontSize: 24 }} />;
      case 'milestone':
        return <CalendarOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'case_update':
        return <FileTextOutlined style={{ color: '#722ed1', fontSize: 24 }} />;
      default:
        return <BellOutlined style={{ color: '#13c2c2', fontSize: 24 }} />;
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={total} size="small" offset={[6, 0]}>
          <span>全部消息</span>
        </Badge>
      )
    },
    {
      key: 'unread',
      label: (
        <Badge count={unreadTotal} size="small" offset={[6, 0]} color="#ff4d4f">
          <span>未读消息</span>
        </Badge>
      )
    }
  ];

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">消息通知</div>
            <div className="page-subtitle">
              系统通知、超期提醒和案件更新等消息
              {unreadTotal > 0 && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  {unreadTotal} 条未读
                </Tag>
              )}
            </div>
          </div>
          <Space>
            {unreadTotal > 0 && (
              <Button icon={<ReadOutlined />} onClick={handleMarkAllRead}>
                全部已读
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchUnreadCount(); }}>
              刷新
            </Button>
          </Space>
        </div>
      </div>

      <Card
        bodyStyle={{ padding: 0 }}
        className="card-shadow"
        tabBarExtraContent={
          <Space>
            <Select
              placeholder="筛选类型"
              allowClear
              style={{ width: 160 }}
              value={typeFilter}
              onChange={v => { setTypeFilter(v); setPage(1); }}
              options={NOTIFICATION_TYPE_OPTIONS}
              size="small"
            />
          </Space>
        }
      >
        <Tabs
          activeKey={tab}
          onChange={k => { setTab(k); setPage(1); }}
          items={tabItems}
          style={{ padding: '0 16px' }}
        />

        <Spin spinning={loading}>
          {data.length === 0 ? (
            <Empty
              description={tab === 'unread' ? '暂无未读消息' : '暂无消息'}
              style={{ padding: '60px 0' }}
            />
          ) : (
            <List
              dataSource={data}
              rowKey="id"
              renderItem={item => {
                const isOverdue = item.type === 'deadline_overdue';
                return (
                  <List.Item
                    style={{
                      padding: '16px 24px',
                      background: !item.is_read ? '#f0f8ff' : 'transparent',
                      borderLeft: isOverdue ? '3px solid #ff4d4f' : (!item.is_read ? '3px solid #1890ff' : 'none'),
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = !item.is_read ? '#e6f4ff' : '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = !item.is_read ? '#f0f8ff' : 'transparent'}
                    onClick={() => handleClick(item)}
                    actions={[
                      !item.is_read ? (
                        <Tooltip title="标记已读">
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(item); }}
                          >
                            已读
                          </Button>
                        </Tooltip>
                      ) : null,
                      <Popconfirm
                        title="删除该消息？"
                        okType="danger"
                        onConfirm={(e) => { e.stopPropagation(); handleDelete(item); }}
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: item.is_read ? '#f0f0f0' : (
                              item.type === 'deadline_overdue' ? '#fff2f0' :
                              item.type === 'deadline_warning' ? '#fff7e6' :
                              item.type === 'milestone' ? '#e6f4ff' : '#e6fffb'
                            )
                          }}
                          icon={getNotificationIcon(item.type)}
                          size={44}
                        />
                      }
                      title={
                        <Space>
                          <Text strong={!item.is_read} style={{ fontSize: 14 }}>
                            {item.title}
                          </Text>
                          <Tag color={getOptionColor(NOTIFICATION_TYPE_OPTIONS, item.type)} style={{ fontSize: 11 }}>
                            {getOptionLabel(NOTIFICATION_TYPE_OPTIONS, item.type)}
                          </Tag>
                          {item.send_method && item.send_method !== 'system' && (
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              {item.send_method === 'email' ? '📧 邮件' : '📱 短信'}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666', marginBottom: 4 }}>
                            {item.content}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            <ClockCircleOutlined /> {formatDateTime(item.created_at)}
                            <span style={{ margin: '0 8px' }}>·</span>
                            {formatRelativeTime(item.created_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: t => `共 ${t} 条消息`,
                onChange: p => setPage(p)
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}

export default NotificationPage;
