import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Table, Button, Space, Input, Select, DatePicker, Tag, Popconfirm, App,
  Row, Col, Tooltip, Avatar, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, UserOutlined, FilterOutlined, ExportOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { caseAPI, userAPI } from '../../api';
import {
  CASE_TYPE_OPTIONS, CASE_STATUS_OPTIONS, FEE_STATUS_OPTIONS,
  getOptionLabel, getOptionColor
} from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/helpers';

const { RangePicker } = DatePicker;
const { Text } = Typography;

function CaseList() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [lawyers, setLawyers] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchLawyers = async () => {
    try {
      const res = await userAPI.getLawyers();
      setLawyers(res.data || []);
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchText || undefined,
        ...filters
      };
      const res = await caseAPI.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({});
    setSearchText('');
    setPagination({ current: 1, pageSize: 10 });
    setTimeout(fetchData, 0);
  };

  const handleDelete = async (record) => {
    try {
      await caseAPI.delete(record.id);
      message.success('案件删除成功');
      fetchData();
    } catch (e) {}
  };

  const confirmDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除案件「${record.case_name}」吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleDelete(record)
    });
  };

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_number',
      width: 140,
      fixed: 'left',
      render: v => <Tag color="blue">{v}</Tag>
    },
    {
      title: '案件名称',
      dataIndex: 'case_name',
      width: 200,
      ellipsis: true,
      render: (v, record) => (
        <a onClick={() => navigate(`/cases/${record.id}`)}>{v}</a>
      )
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      width: 100,
      render: v => (
        <Tag color={getOptionColor(CASE_TYPE_OPTIONS, v)}>
          {getOptionLabel(CASE_TYPE_OPTIONS, v)}
        </Tag>
      )
    },
    { title: '案由', dataIndex: 'cause_of_action', width: 150, ellipsis: true },
    { title: '受理法院', dataIndex: 'court', width: 150, ellipsis: true },
    {
      title: '主办律师',
      dataIndex: ['lead_lawyer', 'real_name'],
      width: 100,
      render: (v, record) => v || (
        <Text type="secondary">
          {record.lead_lawyer_id ? '未知' : '未分配'}
        </Text>
      )
    },
    {
      title: '案件状态',
      dataIndex: 'status',
      width: 100,
      render: v => (
        <Tag color={getOptionColor(CASE_STATUS_OPTIONS, v)}>
          {getOptionLabel(CASE_STATUS_OPTIONS, v)}
        </Tag>
      )
    },
    { title: '立案日期', dataIndex: 'filing_date', width: 110, render: v => formatDate(v) },
    {
      title: '案件费用',
      dataIndex: 'case_fee',
      width: 110,
      render: (v, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatCurrency(v)}</Text>
          {record.fee_status && (
            <Tag color={getOptionColor(FEE_STATUS_OPTIONS, record.fee_status)}>
              {getOptionLabel(FEE_STATUS_OPTIONS, record.fee_status)}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: v => formatDate(v, 'YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/cases/${record.id}`)}>
              查看
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/cases/edit/${record.id}`)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="删除"
            okType="danger"
            onConfirm={() => confirmDelete(record)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const filterContent = (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="案件类型"
            allowClear
            style={{ width: '100%' }}
            value={filters.case_type || undefined}
            onChange={v => setFilters(f => ({ ...f, case_type: v }))}
            options={CASE_TYPE_OPTIONS}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="案件状态"
            allowClear
            style={{ width: '100%' }}
            value={filters.status || undefined}
            onChange={v => setFilters(f => ({ ...f, status: v }))}
            options={CASE_STATUS_OPTIONS}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="主办律师"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: '100%' }}
            value={filters.lead_lawyer_id || undefined}
            onChange={v => setFilters(f => ({ ...f, lead_lawyer_id: v }))}
            options={lawyers.map(l => ({ value: l.id, label: l.real_name }))}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            value={filters.start_date && filters.end_date ? [dayjs(filters.start_date), dayjs(filters.end_date)] : null}
            onChange={dates => setFilters(f => ({
              ...f,
              start_date: dates?.[0]?.format('YYYY-MM-DD') || undefined,
              end_date: dates?.[1]?.format('YYYY-MM-DD') || undefined
            }))}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24 - 6}>
          <Space wrap>
            <Button icon={<FilterOutlined />} onClick={handleSearch}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            <div style={{ flex: 1 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/cases/create')}>
              新建案件
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  const searchBar = (
    <Input
      allowClear
      size="large"
      placeholder="搜索案件编号、名称、案由、对方当事人..."
      prefix={<SearchOutlined />}
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
      onPressEnter={handleSearch}
      style={{ width: 360, marginBottom: 16 }}
    />
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">案件管理</div>
        <div className="page-subtitle">管理所有案件信息，支持多维度筛选和快速操作</div>
      </div>

      {searchBar}
      {filterContent}

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
            showTotal: t => `共 ${t} 条`,
            onChange: (current, pageSize) => setPagination({ current, pageSize })
          }}
        />
      </Card>
    </div>
  );
}

export default CaseList;
