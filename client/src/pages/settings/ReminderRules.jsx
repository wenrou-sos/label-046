import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Modal, Form, Select, Switch, NumberPicker,
  App, Tag, Tooltip, Popconfirm, Row, Col, Checkbox, Slider, Empty, Spin, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  SettingOutlined, ExclamationCircleOutlined, PlayCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, MailOutlined, PhoneOutlined, BellOutlined, ExperimentOutlined
} from '@ant-design/icons';
import { reminderRuleAPI } from '../../api';
import {
  REMINDER_PRIORITY_OPTIONS, USER_ROLE_OPTIONS, getOptionLabel, getOptionColor
} from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';

const { Option } = Select;

function ReminderRules() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await reminderRuleAPI.list({ pageSize: 100, keyword: searchText || undefined });
      setData(res.data?.list || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleToggle = async (record) => {
    try {
      await reminderRuleAPI.toggle(record.id);
      message.success(`规则已${record.is_enabled ? '禁用' : '启用'}`);
      fetchData();
    } catch (e) {}
  };

  const handleDelete = async (record) => {
    try {
      await reminderRuleAPI.delete(record.id);
      message.success('规则删除成功');
      fetchData();
    } catch (e) {}
  };

  const confirmDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除提醒规则「${record.name}」吗？`,
      okType: 'danger',
      onOk: () => handleDelete(record)
    });
  };

  const openEditModal = (record = null) => {
    setEditingRule(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        notify_methods: Array.isArray(record.notify_methods) ? record.notify_methods : JSON.parse(record.notify_methods || '["system"]'),
        notify_roles: Array.isArray(record.notify_roles) ? record.notify_roles : JSON.parse(record.notify_roles || '["lawyer"]'),
        extra_user_ids: Array.isArray(record.extra_user_ids) ? record.extra_user_ids : JSON.parse(record.extra_user_ids || '[]'),
        repeat_warning: !!record.repeat_warning
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        warning_days: 3,
        repeat_warning: false,
        repeat_interval_hours: 24,
        notify_methods: ['system'],
        notify_roles: ['lawyer'],
        is_enabled: 1,
        priority: 'medium'
      });
    }
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        warning_days: Number(values.warning_days),
        repeat_interval_hours: Number(values.repeat_interval_hours),
        repeat_warning: values.repeat_warning ? 1 : 0,
        is_enabled: values.is_enabled ? 1 : 0
      };

      if (editingRule) {
        await reminderRuleAPI.update(editingRule.id, data);
        message.success('规则更新成功');
      } else {
        await reminderRuleAPI.create(data);
        message.success('规则创建成功');
      }
      setEditModal(false);
      fetchData();
    } catch (e) {}
  };

  const handleRunCheck = async () => {
    modal.confirm({
      title: '手动触发提醒检查',
      content: '将立即扫描所有即将到期和已超期的节点并发送提醒。是否继续？',
      okText: '确认执行',
      onOk: async () => {
        try {
          setLoading(true);
          await reminderRuleAPI.runCheck();
          message.success('提醒检查执行完成，请查看消息通知');
          fetchData();
        } catch (e) {} finally {
          setLoading(false);
        }
      }
    });
  };

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 180,
      render: (v, record) => (
        <Space>
          <ExclamationCircleOutlined style={{ color: getOptionColor([{ value: 'low', color: '#8c8c8c' }, { value: 'medium', color: '#1890ff' }, { value: 'high', color: '#fa8c16' }, { value: 'urgent', color: '#ff4d4f' }], record.priority) }} />
          <Text strong>{v}</Text>
        </Space>
      )
    },
    {
      title: '适用节点',
      dataIndex: 'milestone_name',
      width: 140,
      render: v => v || <Tag color="blue">所有节点</Tag>
    },
    {
      title: '提前提醒',
      dataIndex: 'warning_days',
      width: 120,
      render: v => v === 0 ? <Tag color="red">超期时</Tag> : <Tag>{v} 天前</Tag>
    },
    {
      title: '重复提醒',
      dataIndex: 'repeat_warning',
      width: 130,
      render: (v, record) => v ? (
        <Tag color="orange">是 · {record.repeat_interval_hours}h/次</Tag>
      ) : (
        <Tag>否</Tag>
      )
    },
    {
      title: '通知方式',
      dataIndex: 'notify_methods',
      width: 160,
      render: v => {
        const methods = Array.isArray(v) ? v : JSON.parse(v || '["system"]');
        return (
          <Space size={4}>
            {methods.includes('system') && <Tooltip title="系统通知"><Tag><BellOutlined /> 系统</Tag></Tooltip>}
            {methods.includes('email') && <Tooltip title="邮件"><Tag><MailOutlined /> 邮件</Tag></Tooltip>}
            {methods.includes('sms') && <Tooltip title="短信"><Tag><PhoneOutlined /> 短信</Tag></Tooltip>}
          </Space>
        );
      }
    },
    {
      title: '通知角色',
      dataIndex: 'notify_roles',
      width: 160,
      render: v => {
        const roles = Array.isArray(v) ? v : JSON.parse(v || '["lawyer"]');
        return (
          <Space wrap size={4}>
            {roles.map(r => (
              <Tag key={r} color={getOptionColor(USER_ROLE_OPTIONS, r)}>
                {getOptionLabel(USER_ROLE_OPTIONS, r)}
              </Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      render: v => (
        <Tag color={getOptionColor(REMINDER_PRIORITY_OPTIONS, v)}>
          {getOptionLabel(REMINDER_PRIORITY_OPTIONS, v)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      width: 100,
      render: (v, record) => (
        <Switch
          checked={!!v}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<DeleteOutlined />}
          onChange={() => handleToggle(record)}
        />
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="删除该规则？" okType="danger" onConfirm={() => confirmDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">提醒规则配置</div>
            <div className="page-subtitle">
              自定义案件节点超期提醒规则，支持多方式、多角色通知
            </div>
          </div>
          <Space>
            <Button
              icon={<ExperimentOutlined />}
              onClick={handleRunCheck}
            >
              立即检查
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditModal()}>
              新建规则
            </Button>
          </Space>
        </div>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="关于超期提醒"
        description={
          <div>
            <div>1. 系统默认每天 08:00、12:00、18:00 自动扫描即将到期和已超期的节点。</div>
            <div>2. 可通过「立即检查」按钮手动触发扫描。</div>
            <div>3. 若需启用邮件/短信提醒，请在后端配置SMTP和短信API参数。</div>
          </div>
        }
      />

      <Card
        className="card-shadow"
        title={
          <Space>
            <Input
              allowClear
              placeholder="搜索规则名称"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 240 }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {data.length === 0 ? (
            <Empty description="暂无提醒规则，点击右上角「新建规则」开始配置" />
          ) : (
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: t => `共 ${t} 条规则`
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingRule ? '编辑提醒规则' : '新建提醒规则'}
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleSave}
        okText="保存规则"
        width={680}
      >
        <Form form={form} layout="vertical" size="large" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="如：开庭前3天紧急提醒" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="milestone_name"
                label="适用节点名称"
              >
                <Input placeholder="留空表示所有节点" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 0, marginBottom: 12 }}>
            <SettingOutlined /> 提醒时机
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="warning_days"
                label="提前提醒天数"
                tooltip="0表示节点超期时发送提醒"
                rules={[{ required: true, message: '请设置' }]}
              >
                <Select>
                  {[0, 1, 2, 3, 5, 7, 10, 15, 30].map(d => (
                    <Option key={d} value={d}>
                      {d === 0 ? '超期时提醒' : `提前 ${d} 天`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true }]}
              >
                <Select options={REMINDER_PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="repeat_warning"
                label="重复提醒"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="repeat_interval_hours"
                label="重复间隔(小时)"
                tooltip="开启重复提醒后生效"
              >
                <Select disabled={!form.getFieldValue?.('repeat_warning')}>
                  {[1, 2, 4, 6, 8, 12, 24, 48].map(h => (
                    <Option key={h} value={h}>{h} 小时</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 0, marginBottom: 12 }}>
            <BellOutlined /> 通知配置
          </Divider>

          <Form.Item
            name="notify_methods"
            label="通知方式"
            rules={[{ required: true, message: '请选择至少一种通知方式' }]}
          >
            <Checkbox.Group>
              <Space wrap size="large">
                <Checkbox value="system"><BellOutlined /> 系统通知</Checkbox>
                <Checkbox value="email"><MailOutlined /> 邮件通知</Checkbox>
                <Checkbox value="sms"><PhoneOutlined /> 短信通知</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="notify_roles"
            label="通知角色"
            rules={[{ required: true, message: '请选择至少一个通知角色' }]}
          >
            <Checkbox.Group>
              <Space wrap size="large">
                {USER_ROLE_OPTIONS.map(o => (
                  <Checkbox key={o.value} value={o.value}>{o.label}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="is_enabled"
            label="启用规则"
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

const { Text, Divider } = require('antd');

export default ReminderRules;
