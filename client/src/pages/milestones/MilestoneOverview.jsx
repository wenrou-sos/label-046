import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Select, DatePicker, Tag, App,
  Row, Col, Tooltip, Empty, Progress, Statistic, Spin
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { milestoneAPI, caseAPI, userAPI } from '../../api';
import {
  CASE_STATUS_OPTIONS, MILESTONE_STATUS_OPTIONS, getOptionLabel, getOptionColor
} from '../../utils/constants';
import { formatDate, formatDateTime, daysUntil } from '../../utils/helpers';

const { RangePicker } = DatePicker;

function MilestoneOverview() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, delayed: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchStats = async () => {
    try {
      const res = await milestoneAPI.list({ upcoming: 'true', pageSize: 100 });
      setUpcoming(res.data?.list || []);
      const res2 = await milestoneAPI.list({ overdue: 'true', pageSize: 100 });
      setOverdue(res2.data?.list || []);

      const countPending = (res2.data?.list || []).filter(m =>
        ['pending', 'in_progress', 'delayed'].includes(m.status) && daysUntil(m.deadline_date) !== null && daysUntil(m.deadline_date) < 0
      ).length;

      setStats({
        pending: (res.data?.list || []).filter(m => m.status === 'pending').length || 0,
        inProgress: (res.data?.list || []).filter(m => m.status === 'in_progress').length || 0,
        completed: (res.data?.list || []).filter(m => m.status === 'completed').length || 0,
        delayed: countPending || 0
      });
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      };
      const res = await milestoneAPI.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await milestoneAPI.updateStatus(id, status);
      message.success('状态更新成功');
      fetchData();
      fetchStats();
    } catch (e) {}
  };

  const columns = [
    {
      title: '节点名称',
      dataIndex: 'name',
      width: 160,
      render: (v, record) => (
        <Space>
          <ClockCircleOutlined style={{
            color: record.status === 'completed' ? '#52c41a'
                 : record.status === 'delayed' ? '#ff4d4f' : '#1890ff'
          }} />
          <Text strong>{v}</Text>
        </Space>
      )
    },
    {
      title: '关联案件',
      dataIndex: ['case_info', 'case_name'],
      width: 200,
      render: (v, record) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => navigate(`/cases/${record.case_id}`)}>{v || '-'}</a>
          {record.case_info?.case_number && (
            <Tag color="blue" style={{ fontSize: 11 }}>{record.case_info.case_number}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '计划日期',
      dataIndex: 'planned_date',
      width: 110,
      render: v => formatDate(v)
    },
    {
      title: '截止日期',
      dataIndex: 'deadline_date',
      width: 110,
      sorter: (a, b) => new Date(a.deadline_date) - new Date(b.deadline_date),
      render: (v, record) => {
        const days = daysUntil(v);
        let color = '#666';
        if (record.status === 'completed') color = '#52c41a';
        else if (days !== null) {
          if (days < 0) color = '#ff4d4f';
          else if (days <= 3) color = '#fa8c16';
          else if (days <= 7) color = '#faad14';
        }
        return <Text style={{ color, fontWeight: days !== null && days < 3 ? 600 : 400 }}>{formatDate(v)}</Text>;
      }
    },
    {
      title: '倒计时',
      width: 110,
      render: (_, record) => {
        if (record.status === 'completed') {
          return <Tag color="success">已完成</Tag>;
        }
        if (record.status === 'cancelled') {
          return <Tag>已取消</Tag>;
        }
        const days = daysUntil(record.deadline_date);
        if (days === null) return <Text type="secondary">-</Text>;
        if (days < 0) return <Tag color="red">超期{Math.abs(days)}天</Tag>;
        if (days === 0) return <Tag color="orange">今天到期</Tag>;
        if (days <= 3) return <Tag color="orange">{days}天</Tag>;
        if (days <= 7) return <Tag color="blue">{days}天</Tag>;
        return <Tag>{days}天</Tag>;
      }
    },
    {
      title: '实际完成',
      dataIndex: 'actual_date',
      width: 110,
      render: v => v ? <Text type="success">{formatDate(v)}</Text> : '-'
    },
    {
      title: '负责人',
      dataIndex: ['assignee', 'real_name'],
      width: 100,
      render: v => v || <Text type="secondary">未指定</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      filters: MILESTONE_STATUS_OPTIONS.map(o => ({ text: o.label, value: o.value })),
      onFilter: (value, record) => record.status === value,
      render: v => (
        <Tag color={getOptionColor(MILESTONE_STATUS_OPTIONS, v)}>
          {getOptionLabel(MILESTONE_STATUS_OPTIONS, v)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: v => formatDateTime(v)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/cases/${record.case_id}`)}>
            查看案件
          </Button>
          {record.status !== 'completed' && (
            <Button
              type="link"
              size="small"
              type="primary"
              onClick={() => handleStatusChange(record.id, 'completed')}
            >
              完成
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">关键节点追踪</div>
        <div className="page-subtitle">查看和管理所有案件的关键节点进度与超期情况</div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待开始节点"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.inProgress}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已超期"
              value={stats.delayed}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#fa8c16' }} />
                <span>即将到期 (7天内)</span>
              </Space>
            }
            size="small"
            className="card-shadow"
          >
            {upcoming.length === 0 ? (
              <Empty description="暂无即将到期的节点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {upcoming.slice(0, 8).map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/cases/${m.case_id}`)}
                  >
                    <div>
                      <Text strong>{m.name}</Text>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {m.case_info?.case_name}
                      </div>
                    </div>
                    <Tag color="orange" style={{ marginRight: 0 }}>
                      {formatDate(m.deadline_date)}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                <span>已超期节点</span>
              </Space>
            }
            size="small"
            className="card-shadow"
          >
            {overdue.length === 0 ? (
              <Empty description="无超期节点，做得好！" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {overdue.slice(0, 8).map(m => (
                  <div
                    key={m.id}
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f0f0f0',
                      background: '#fff1f0',
                      cursor: 'pointer',
                      borderRadius: 4,
                      marginBottom: 4
                    }}
                    onClick={() => navigate(`/cases/${m.case_id}`)}
                  >
                    <div>
                      <Text strong>{m.name}</Text>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {m.case_info?.case_name}
                      </div>
                    </div>
                    <Tag color="red" style={{ marginRight: 0 }}>
                      超期 {Math.abs(daysUntil(m.deadline_date) || 0)}天
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="节点状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={v => setFilters(f => ({ ...f, status: v }))}
              options={MILESTONE_STATUS_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              onChange={dates => setFilters(f => ({
                ...f,
                start_date: dates?.[0]?.format('YYYY-MM-DD') || undefined,
                end_date: dates?.[1]?.format('YYYY-MM-DD') || undefined
              }))}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Input
                allowClear
                placeholder="搜索节点/案件名"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => { setSearchText(e.target.value); setFilters(f => ({ ...f, keyword: e.target.value })) }}
                style={{ width: 180 }}
              />
              <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setSearchText(''); fetchData(); fetchStats(); }}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="card-shadow">
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条节点`,
            onChange: (current, pageSize) => setPagination({ current, pageSize })
          }}
        />
      </Card>
    </div>
  );
}

const { Text } = require('antd');

export default MilestoneOverview;
