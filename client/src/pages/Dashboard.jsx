import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, List, Avatar, Typography, Space, Button, Tooltip, Empty, Spin
} from 'antd';
import {
  FileTextOutlined, TeamOutlined, FolderOpenOutlined, UserOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, BellOutlined, FilePdfOutlined, RightOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { statisticsAPI, notificationAPI } from '../api';
import {
  CASE_STATUS_OPTIONS, CASE_TYPE_OPTIONS, MILESTONE_STATUS_OPTIONS, getOptionLabel, getOptionColor
} from '../utils/constants';
import { formatDate, formatDateTime, formatFileSize, daysUntil } from '../utils/helpers';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    summary: {},
    casesByStatus: [],
    casesByType: [],
    upcomingMilestones: [],
    overdueMilestones: [],
    recentDocuments: [],
    recentNotifications: [],
    monthlyCases: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await statisticsAPI.dashboard();
      setData(res.data || {});
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const statusChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle' },
    series: [{
      type: 'pie',
      radius: ['45%', '65%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: (data.casesByStatus || []).map(item => ({
        name: getOptionLabel(CASE_STATUS_OPTIONS, item.status),
        value: parseInt(item.count || 0)
      })),
      color: ['#8c8c8c', '#faad14', '#1890ff', '#722ed1', '#52c41a', '#fa541c', '#13c2c2', '#eb2f96']
    }]
  };

  const typeChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', axisLabel: { interval: 0, rotate: 20 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: (data.casesByType || []).map(item => ({
        name: getOptionLabel(CASE_TYPE_OPTIONS, item.case_type),
        value: parseInt(item.count || 0)
      })),
      itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] }
    }],
    dataset: {
      dimensions: ['name', 'value'],
      source: (data.casesByType || []).map(item => [
        getOptionLabel(CASE_TYPE_OPTIONS, item.case_type),
        parseInt(item.count || 0)
      ])
    }
  };

  const monthlyChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: (data.monthlyCases || []).map(m => m.date || m.dataValues?.date || '')
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '新增案件',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
      lineStyle: { width: 2, color: '#1890ff' },
      itemStyle: { color: '#1890ff' },
      data: (data.monthlyCases || []).map(m => parseInt(m.count || m.dataValues?.count || 0))
    }]
  };

  const milestoneColumns = [
    {
      title: '节点名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: record.status === 'delayed' ? '#ff4d4f' : '#1890ff' }} />
          <Text strong>{record.name}</Text>
        </Space>
      )
    },
    { title: '关联案件', dataIndex: ['case_info', 'case_name'], render: v => v || '-' },
    {
      title: '截止日期',
      dataIndex: 'deadline_date',
      render: v => {
        const days = daysUntil(v);
        let color = '#666';
        if (days !== null) {
          if (days < 0) color = '#ff4d4f';
          else if (days <= 3) color = '#fa8c16';
          else if (days <= 7) color = '#faad14';
        }
        return <Text style={{ color }}>{formatDate(v)}</Text>;
      }
    },
    {
      title: '剩余天数',
      render: (_, record) => {
        const days = daysUntil(record.deadline_date);
        if (days === null) return '-';
        if (days < 0) return <Tag color="red">已超期{Math.abs(days)}天</Tag>;
        if (days === 0) return <Tag color="orange">今天到期</Tag>;
        if (days <= 3) return <Tag color="orange">{days}天</Tag>;
        return <Tag color="blue">{days}天</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: v => (
        <Tag color={getOptionColor(MILESTONE_STATUS_OPTIONS, v)}>
          {getOptionLabel(MILESTONE_STATUS_OPTIONS, v)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/cases/${record.case_id}`)}>
          查看案件
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
          <div className="page-title">工作台</div>
          <div className="page-subtitle">欢迎回来，今天是 {dayjs().format('YYYY年MM月DD日 dddd')}</div>
          </div>
          <Button type="primary" icon={<FileTextOutlined />} onClick={() => navigate('/cases/create')}>
            新建案件
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card hoverable className="card-shadow stat-card-fixed" onClick={() => navigate('/cases')}>
              <Statistic
                title="案件总数"
                value={data.summary?.totalCases || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="stat-card-extra">
                本周新增：{data.summary?.thisWeekNew || 0}
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card hoverable className="card-shadow stat-card-fixed" onClick={() => navigate('/parties')}>
              <Statistic
                title="当事人总数"
                value={data.summary?.totalParties || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="stat-card-extra">
                &nbsp;
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card hoverable className="card-shadow stat-card-fixed" onClick={() => navigate('/documents')}>
              <Statistic
                title="卷宗文件数"
                value={data.summary?.totalDocuments || 0}
                prefix={<FolderOpenOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
              <div className="stat-card-extra">
                &nbsp;
              </div>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card hoverable className="card-shadow stat-card-fixed" onClick={() => navigate('/notifications')}>
              <Statistic
                title="未读消息"
                value={data.summary?.unreadCount || 0}
                prefix={<BellOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div className="stat-card-extra">
                &nbsp;
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="案件状态分布" className="card-shadow" extra={<Button type="link" onClick={() => navigate('/cases')}>查看全部 <RightOutlined /></Button>}>
              {data.casesByStatus && data.casesByStatus.length > 0 ? (
                <ReactECharts option={statusChartOption} style={{ height: 260 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: '40px 0' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="案件类型分布" className="card-shadow">
              {data.casesByType && data.casesByType.length > 0 ? (
                <ReactECharts option={typeChartOption} style={{ height: 260 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: '40px 0' }} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={24}>
            <Card title="近12个月新增案件趋势" className="card-shadow">
              {(data.monthlyCases && data.monthlyCases.length > 0) ? (
                <ReactECharts option={monthlyChartOption} style={{ height: 280 }} />
              ) : (
                <Empty description="暂无数据" style={{ padding: '40px 0' }} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>即将到期节点</span>
                </Space>
              }
              className="card-shadow"
              extra={<Button type="link" onClick={() => navigate('/milestones')}>查看全部</Button>}
            >
              {(data.upcomingMilestones && data.upcomingMilestones.length > 0) ? (
                <Table
                  size="small"
                  columns={milestoneColumns}
                  dataSource={data.upcomingMilestones}
                  rowKey="id"
                  pagination={false}
                />
              ) : (
                <Empty description="暂无即将到期节点" style={{ padding: '20px 0' }} />
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
              className="card-shadow"
              extra={<Button type="link" danger onClick={() => navigate('/milestones?overdue=true')}>查看全部</Button>}
            >
              {(data.overdueMilestones && data.overdueMilestones.length > 0) ? (
                <Table
                  size="small"
                  columns={milestoneColumns}
                  dataSource={data.overdueMilestones}
                  rowKey="id"
                  pagination={false}
                />
              ) : (
                <Empty description="无超期节点，做得好！" style={{ padding: '20px 0' }} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FolderOpenOutlined />
                  <span>最近上传卷宗</span>
                </Space>
              }
              className="card-shadow"
              extra={<Button type="link" onClick={() => navigate('/documents')}>查看全部</Button>}
            >
              {(data.recentDocuments && data.recentDocuments.length > 0) ? (
                <List
                  size="small"
                  dataSource={data.recentDocuments}
                  rowKey="id"
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatFileSize(item.file_size)}
                        </Text>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<FilePdfOutlined style={{ color: '#1890ff' }} />} />}
                        title={
                          <Text ellipsis style={{ maxWidth: 260 }}>
                            <a onClick={() => navigate(`/cases/${item.case_id}`)}>{item.file_name}</a>
                          </Text>
                        }
                        description={
                          <Space size={[8, 4]} wrap>
                            <Text type="secondary">
                              <UserOutlined /> {item.uploader?.real_name}
                            </Text>
                            <Text type="secondary">{formatDateTime(item.uploaded_at)}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无卷宗" style={{ padding: '20px 0' }} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <BellOutlined />
                  <span>最近通知</span>
                </Space>
              }
              className="card-shadow"
              extra={<Button type="link" onClick={() => navigate('/notifications')}>查看全部</Button>}
            >
              {(data.recentNotifications && data.recentNotifications.length > 0) ? (
                <List
                  size="small"
                  dataSource={data.recentNotifications}
                  rowKey="id"
                  renderItem={item => (
                    <List.Item style={{ opacity: item.is_read ? 0.6 : 1 }}>
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: item.is_read ? '#ccc' : '#1890ff' }} icon={<BellOutlined />} />}
                        title={<Text strong={!item.is_read}>{item.title}</Text>}
                        description={
                          <Space direction="vertical" size={4} style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.content}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{formatRelativeTime(item.created_at)}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无通知" style={{ padding: '20px 0' }} />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

const formatRelativeTime = (date) => formatDateTime(date);

export default Dashboard;
