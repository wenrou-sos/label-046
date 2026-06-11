import React from 'react';
import { Timeline, Tag, Button, Dropdown, Space, Popconfirm, Tooltip, Text, Avatar, Card, Empty } from 'antd';
import {
  ClockCircleOutlined, CheckCircleTwoTone, ExclamationCircleTwoTone,
  PlayCircleOutlined, CloseCircleOutlined, TeamOutlined, CalendarOutlined
} from '@ant-design/icons';
import { MILESTONE_STATUS_OPTIONS, getOptionLabel, getOptionColor } from '../../utils/constants';
import { formatDate, daysUntil } from '../../utils/helpers';
import dayjs from 'dayjs';

function MilestoneTimeline({ milestones = [], onStatusChange }) {
  if (milestones.length === 0) {
    return <Empty description="暂无节点数据" />;
  }

  const getTimelineIcon = (status, deadline) => {
    const days = daysUntil(deadline);
    const isDelayed = status !== 'completed' && days !== null && days < 0;

    if (status === 'completed') {
      return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 24 }} />;
    }
    if (status === 'cancelled') {
      return <CloseCircleOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
    }
    if (isDelayed || status === 'delayed') {
      return <ExclamationCircleTwoTone twoToneColor="#ff4d4f" style={{ fontSize: 24 }} />;
    }
    if (status === 'in_progress') {
      return <PlayCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    }
    return <ClockCircleOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
  };

  const getStatusActions = (record) => {
    const current = record.status;
    const actions = [];

    if (current === 'pending') {
      actions.push({
        key: 'in_progress',
        label: '开始执行',
        onClick: () => onStatusChange && onStatusChange(record.id, 'in_progress')
      });
    }
    if (['pending', 'in_progress', 'delayed'].includes(current)) {
      actions.push({
        key: 'completed',
        label: '标记完成',
        onClick: () => onStatusChange && onStatusChange(record.id, 'completed')
      });
    }
    if (current !== 'cancelled' && current !== 'completed') {
      actions.push({
        key: 'cancelled',
        label: '取消',
        onClick: () => onStatusChange && onStatusChange(record.id, 'cancelled')
      });
    }

    return actions;
  };

  const renderDayBadge = (deadline, status) => {
    if (!deadline) return null;
    const days = daysUntil(deadline);
    if (days === null) return null;

    if (status === 'completed') {
      return <Tag color="success" icon={<CalendarOutlined />}>已完成于 {formatDate(status.actual_date || deadline)}</Tag>;
    }
    if (days < 0) return <Tag color="red">已超期 {Math.abs(days)} 天</Tag>;
    if (days === 0) return <Tag color="orange">今天截止</Tag>;
    if (days <= 3) return <Tag color="orange">剩余 {days} 天</Tag>;
    if (days <= 7) return <Tag color="blue">剩余 {days} 天</Tag>;
    return <Tag color="default">剩余 {days} 天</Tag>;
  };

  const items = milestones.map(m => {
    const actions = getStatusActions(m);

    return {
      color: m.status === 'completed' ? 'green'
           : m.status === 'cancelled' ? 'gray'
           : m.status === 'delayed' ? 'red'
           : m.status === 'in_progress' ? 'blue' : 'gray',
      dot: getTimelineIcon(m.status, m.deadline_date),
      children: (
        <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ fontSize: 15 }}>{m.name}</Text>
                <Tag
                  color={getOptionColor(MILESTONE_STATUS_OPTIONS, m.status)}
                  style={{ marginLeft: 8 }}
                >
                  {getOptionLabel(MILESTONE_STATUS_OPTIONS, m.status)}
                </Tag>
                {m.is_auto_generated && <Tag color="default">系统生成</Tag>}
                {renderDayBadge(m.deadline_date, m)}
              </div>

              {m.description && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {m.description}
                </Text>
              )}

              {m.assignee && (
                <div style={{ marginTop: 4 }}>
                  <Avatar size={18} style={{ backgroundColor: '#1890ff', marginRight: 6 }}>
                    <TeamOutlined style={{ fontSize: 12 }} />
                  </Avatar>
                  <Text type="secondary">负责人：{m.assignee.real_name}</Text>
                </div>
              )}

              {(m.planned_date || m.deadline_date || m.actual_date) && (
                <Space size={16} style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
                  {m.planned_date && (
                    <Text type="secondary">
                      <CalendarOutlined /> 计划：{formatDate(m.planned_date)}
                    </Text>
                  )}
                  {m.deadline_date && m.deadline_date !== m.planned_date && (
                    <Text type="secondary">
                      <ClockCircleOutlined /> 截止：{formatDate(m.deadline_date)}
                    </Text>
                  )}
                  {m.actual_date && (
                    <Text>
                      <CheckCircleTwoTone twoToneColor="#52c41a" /> 完成：{formatDate(m.actual_date)}
                    </Text>
                  )}
                </Space>
              )}

              {m.completed_note && (
                <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                  <Text type="success">完成备注：{m.completed_note}</Text>
                </div>
              )}
            </div>

            {onStatusChange && actions.length > 0 && (
              <Dropdown
                menu={{ items: actions.map(a => ({ ...a, onClick: undefined })) }}
                trigger={['click']}
                onMenuClick={({ key }) => {
                  const action = actions.find(a => a.key === key);
                  action?.onClick?.();
                }}
              >
                <Button size="small" type="primary" ghost>
                  更新状态
                </Button>
              </Dropdown>
            )}
          </div>
        </Card>
      )
    };
  });

  return (
    <Timeline
      className="timeline-case-milestone"
      style={{ padding: 24 }}
      mode="left"
      items={items}
    />
  );
}

export default MilestoneTimeline;
