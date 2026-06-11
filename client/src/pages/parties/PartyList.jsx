import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Modal, Form, DatePicker,
  App, Tag, Tooltip, Popconfirm, Row, Col, Drawer, Avatar, Descriptions,
  Typography, List, Divider, Empty
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, UserOutlined, TeamOutlined, FilterOutlined, ExportOutlined,
  PhoneOutlined, MailOutlined, HomeOutlined, IdcardOutlined, BankOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { partyAPI } from '../../api';
import {
  PARTY_TYPE_OPTIONS, GENDER_OPTIONS, getOptionLabel, getOptionColor
} from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/helpers';

const { TextArea } = Input;

function PartyList() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [batchModal, setBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [currentParty, setCurrentParty] = useState(null);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchText || undefined,
        ...filters
      };
      const res = await partyAPI.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const showDetail = async (record) => {
    try {
      const res = await partyAPI.get(record.id);
      setCurrentParty(res.data);
      setDetailDrawer(true);
    } catch (e) {}
  };

  const handleDelete = async (record) => {
    try {
      await partyAPI.delete(record.id);
      message.success('删除成功');
      fetchData();
    } catch (e) {}
  };

  const confirmDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除「${record.name}」吗？`,
      okType: 'danger',
      onOk: () => handleDelete(record)
    });
  };

  const handleBatchImport = async () => {
    try {
      if (!batchText.trim()) {
        message.warning('请输入当事人数据');
        return;
      }
      const lines = batchText.trim().split('\n').filter(l => l.trim());
      const parties = [];
      for (const line of lines) {
        const parts = line.split(/[,，\t]/).map(s => s.trim());
        if (parts[0]) {
          parties.push({
            name: parts[0],
            type: parts[1] || 'individual',
            phone: parts[2],
            id_card: parts[3],
            address: parts[4],
            email: parts[5],
            remark: parts[6]
          });
        }
      }
      if (parties.length === 0) {
        message.warning('未解析到有效数据');
        return;
      }
      await partyAPI.batchCreate({ parties });
      message.success(`成功批量导入${parties.length}个当事人`);
      setBatchModal(false);
      setBatchText('');
      fetchData();
    } catch (e) {}
  };

  const columns = [
    {
      title: '姓名/名称',
      dataIndex: 'name',
      width: 160,
      render: (v, record) => (
        <Space>
          <Avatar
            size={36}
            style={{ backgroundColor: record.type === 'company' ? '#722ed1' : '#1890ff' }}
            icon={record.type === 'company' ? <BankOutlined /> : <UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <a onClick={() => showDetail(record)} style={{ fontWeight: 500 }}>{v}</a>
            <Tag color={getOptionColor([{ value: 'individual', color: 'blue' }, { value: 'company', color: 'purple' }, { value: 'organization', color: 'green' }], record.type)}
                 style={{ fontSize: 11, margin: 0 }}>
              {getOptionLabel(PARTY_TYPE_OPTIONS, record.type)}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 70,
      render: v => v && v !== 'unknown' ? getOptionLabel(GENDER_OPTIONS, v) : '-'
    },
    { title: '身份证号', dataIndex: 'id_card', width: 180, render: v => v || '-' },
    { title: '企业名称', dataIndex: 'company_name', width: 180, render: v => v || '-' },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 130,
      render: v => v ? (
        <a href={`tel:${v}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <PhoneOutlined /> {v}
        </a>
      ) : '-'
    },
    { title: '电子邮箱', dataIndex: 'email', width: 160, render: v => v ? <a href={`mailto:${v}`}>{v}</a> : '-' },
    { title: '联系地址', dataIndex: 'address', width: 200, ellipsis: true, render: v => v || '-' },
    { title: '职业', dataIndex: 'occupation', width: 100, render: v => v || '-' },
    { title: '备注', dataIndex: 'remark', width: 150, ellipsis: true, render: v => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: v => formatDateTime(v)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
              详情
            </Button>
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/parties/edit/${record.id}`)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm title="确认删除？" okType="danger" onConfirm={() => confirmDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const filterContent = (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="当事人类型"
            allowClear
            style={{ width: '100%' }}
            value={filters.type || undefined}
            onChange={v => setFilters(f => ({ ...f, type: v }))}
            options={PARTY_TYPE_OPTIONS}
          />
        </Col>
        <Col xs={24} sm={24} md={16}>
          <Space wrap>
            <Button icon={<FilterOutlined />} onClick={fetchData}>查询</Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setFilters({}); setSearchText(''); setPagination({ current: 1, pageSize: 10 }); setTimeout(fetchData, 0); }}>
              重置
            </Button>
            <div style={{ flex: 1 }} />
            <Button icon={<ExportOutlined />} onClick={() => setBatchModal(true)}>批量导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/parties/create')}>
              新建当事人
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">当事人管理</div>
        <div className="page-subtitle">管理所有当事人信息，支持单个和批量创建、多条件筛选</div>
      </div>

      <Input
        allowClear
        size="large"
        placeholder="搜索姓名、企业名称、电话、身份证号、统一社会信用代码..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onPressEnter={fetchData}
        style={{ width: 400, marginBottom: 16 }}
      />
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
            showTotal: t => `共 ${t} 位当事人`,
            onChange: (current, pageSize) => setPagination({ current, pageSize })
          }}
        />
      </Card>

      <Modal
        title="批量导入当事人"
        open={batchModal}
        onCancel={() => setBatchModal(false)}
        onOk={handleBatchImport}
        width={720}
        okText="开始导入"
      >
        <div>
          <div style={{ marginBottom: 12, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 12 }}>
            <div><strong>格式说明（每行一个，字段用逗号或Tab分隔）：</strong></div>
            <div>姓名,类型,电话,身份证号,地址,邮箱,备注</div>
            <div>类型可选值：individual(自然人)、company(企业)、organization(组织)</div>
            <div style={{ marginTop: 8, color: '#666' }}>
              示例：张三,individual,13800138000,110101199001010011,北京市朝阳区,zhangsan@example.com,重要客户
            </div>
          </div>
          <TextArea
            rows={10}
            placeholder="请粘贴或输入当事人数据，每行一个..."
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
          />
        </div>
      </Modal>

      <Drawer
        title="当事人详情"
        width={560}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => { navigate(`/parties/edit/${currentParty?.id}`); setDetailDrawer(false); }}>
              编辑
            </Button>
          </Space>
        }
      >
        {currentParty && (
          <div>
            <Card
              style={{ marginBottom: 16 }}
              bodyStyle={{ textAlign: 'center', padding: '32px 16px' }}
            >
              <Avatar
                size={72}
                style={{ backgroundColor: currentParty.type === 'company' ? '#722ed1' : '#1890ff', marginBottom: 12 }}
                icon={currentParty.type === 'company' ? <BankOutlined style={{ fontSize: 36 }} /> : <UserOutlined style={{ fontSize: 36 }} />}
              />
              <div style={{ fontSize: 20, fontWeight: 600 }}>{currentParty.name}</div>
              <Tag color={getOptionColor([{ value: 'individual', color: 'blue' }, { value: 'company', color: 'purple' }, { value: 'organization', color: 'green' }], currentParty.type)}
                   style={{ marginTop: 8 }}>
                {getOptionLabel(PARTY_TYPE_OPTIONS, currentParty.type)}
              </Tag>
            </Card>

            <Descriptions column={1} bordered size="small">
              {currentParty.type === 'individual' ? (
                <>
                  <Descriptions.Item label="性别">
                    {getOptionLabel(GENDER_OPTIONS, currentParty.gender) || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="身份证号">
                    <Space>
                      <IdcardOutlined />
                      {currentParty.id_card || '-'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="职业">{currentParty.occupation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="国籍">{currentParty.nationality || '-'}</Descriptions.Item>
                </>
              ) : (
                <>
                  <Descriptions.Item label="企业名称">{currentParty.company_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="统一社会信用代码">{currentParty.unified_social_credit || '-'}</Descriptions.Item>
                  <Descriptions.Item label="法定代表人">{currentParty.legal_representative || '-'}</Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="联系电话">
                {currentParty.phone ? <a href={`tel:${currentParty.phone}`}><PhoneOutlined /> {currentParty.phone}</a> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="电子邮箱">
                {currentParty.email ? <a href={`mailto:${currentParty.email}`}><MailOutlined /> {currentParty.email}</a> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系地址">
                {currentParty.address ? <span><HomeOutlined /> {currentParty.address}</span> : '-'}
              </Descriptions.Item>
              {currentParty.remark && (
                <Descriptions.Item label="备注">{currentParty.remark}</Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">{formatDateTime(currentParty.created_at)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">关联案件</Divider>
            {(currentParty.case_associations && currentParty.case_associations.length > 0) ? (
              <List
                size="small"
                dataSource={currentParty.case_associations}
                rowKey="id"
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate(`/cases/${item.case_id}`)}>查看</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.case_info?.case_name}</span>
                          <Tag color="blue" style={{ fontSize: 11 }}>{item.case_info?.case_number}</Tag>
                          <Tag color="green" style={{ fontSize: 11 }}>{item.is_our_client ? '我方' : '对方'}</Tag>
                        </Space>
                      }
                      description={`角色：${getOptionLabel([{ value: 'plaintiff', label: '原告' }, { value: 'defendant', label: '被告' }, { value: 'third_party', label: '第三人' }, { value: 'appellant', label: '上诉人' }, { value: 'appellee', label: '被上诉人' }, { value: 'witness', label: '证人' }], item.role)}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无关联案件" />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default PartyList;
