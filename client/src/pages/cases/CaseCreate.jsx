import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Steps, Row, Col,
  App, Divider, Tabs, Transfer, Alert, Checkbox, Switch, Typography
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { caseAPI, userAPI, partyAPI, milestoneTemplateAPI, milestoneAPI } from '../../api';
import {
  CASE_TYPE_OPTIONS, CASE_STATUS_OPTIONS, FEE_STATUS_OPTIONS,
  PARTY_ROLE_OPTIONS, PARTY_TYPE_OPTIONS
} from '../../utils/constants';
import { generateCaseNumber } from '../../utils/helpers';

const { TextArea } = Input;
const { Option } = Select;
const { Tag, Text } = Typography;

function CaseCreate() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [allParties, setAllParties] = useState([]);
  const [selectedParties, setSelectedParties] = useState([]);
  const [partyRoles, setPartyRoles] = useState({});
  const [linkedParties, setLinkedParties] = useState([]);
  const [autoGenerateMilestones, setAutoGenerateMilestones] = useState(!isEdit);
  const [templates, setTemplates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLawyers();
    fetchParties();
    fetchTemplates();
    if (isEdit) {
      fetchCaseDetail();
    } else {
      form.setFieldsValue({
        case_number: generateCaseNumber(),
        status: 'draft',
        fee_status: 'unpaid'
      });
    }
  }, [id]);

  const fetchLawyers = async () => {
    try {
      const res = await userAPI.getLawyers();
      setLawyers(res.data || []);
    } catch (e) {}
  };

  const fetchParties = async () => {
    try {
      const res = await partyAPI.all();
      setAllParties(res.data || []);
    } catch (e) {}
  };

  const fetchTemplates = async () => {
    try {
      const caseType = form.getFieldValue('case_type');
      const res = await milestoneTemplateAPI.list({ case_type: caseType || undefined });
      setTemplates(res.data || []);
    } catch (e) {}
  };

  const fetchCaseDetail = async () => {
    setLoading(true);
    try {
      const res = await caseAPI.get(id);
      const data = res.data || {};
      form.setFieldsValue({
        ...data,
        filing_date: data.filing_date ? dayjs(data.filing_date) : null,
        closing_date: data.closing_date ? dayjs(data.closing_date) : null
      });

      const linkedIds = [];
      const roles = {};
      const partiesList = [];
      (data.case_parties || []).forEach(cp => {
        if (cp.party_info) {
          linkedIds.push(cp.party_id);
          roles[cp.party_id] = {
            role: cp.role,
            is_our_client: cp.is_our_client,
            attorney_name: cp.attorney_name,
            attorney_phone: cp.attorney_phone
          };
          partiesList.push({
            ...cp.party_info,
            role: cp.role,
            is_our_client: cp.is_our_client,
            attorney_name: cp.attorney_name,
            attorney_phone: cp.attorney_phone
          });
        }
      });
      setSelectedParties(linkedIds);
      setPartyRoles(roles);
      setLinkedParties(partiesList);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const buildPartyRequest = () => {
    return selectedParties.map(partyId => {
      const roleInfo = partyRoles[partyId] || {};
      return {
        party_id: partyId,
        role: roleInfo.role || 'plaintiff',
        is_our_client: roleInfo.is_our_client ?? 1,
        attorney_name: roleInfo.attorney_name,
        attorney_phone: roleInfo.attorney_phone
      };
    });
  };

  const doSubmit = async (action) => {
    try {
      const values = await form.validateFields();
      const caseData = {
        ...values,
        filing_date: values.filing_date?.format('YYYY-MM-DD'),
        closing_date: values.closing_date?.format('YYYY-MM-DD')
      };

      if (action === 'draft') {
        setSaving(true);
        try {
          if (isEdit) {
            await caseAPI.saveDraft(id, caseData);
            await saveParties();
            message.success('草稿保存成功');
          } else {
            const res = await caseAPI.create({
              ...caseData,
              status: 'draft',
              auto_generate_milestones: false
            });
            if (res.data && res.data.id) {
              const caseId = res.data.id;
              const partyReq = buildPartyRequest();
              if (partyReq.length) {
                await partyAPI.batchLinkToCase(caseId, { parties: partyReq });
              }
            }
            message.success('草稿保存成功');
            navigate('/cases');
          }
        } finally {
          setSaving(false);
        }
        return;
      }

      setSubmitting(true);
      try {
        if (isEdit) {
          await caseAPI.submit(id, caseData);
          await saveParties();
          if (autoGenerateMilestones) {
            try {
              await milestoneAPI.generateFromTemplate(id, {
                case_type: caseData.case_type,
                filing_date: caseData.filing_date
              });
            } catch (e) {
              console.warn('自动生成节点失败:', e.message);
            }
          }
          message.success('案件提交成功');
          navigate(`/cases/${id}`);
        } else {
          const res = await caseAPI.create({
            ...caseData,
            auto_generate_milestones: autoGenerateMilestones
          });
          if (res.data && res.data.id) {
            const caseId = res.data.id;
            const partyReq = buildPartyRequest();
            if (partyReq.length) {
              await partyAPI.batchLinkToCase(caseId, { parties: partyReq });
            }
            message.success('案件创建并提交成功');
            navigate(`/cases/${caseId}`);
          }
        }
      } finally {
        setSubmitting(false);
      }
    } catch (e) {}
  };

  const saveParties = async () => {
    if (!isEdit) return;
    try {
      const existing = await partyAPI.getByCase(id);
      const existingMap = new Map();
      (existing.data || []).forEach(cp => {
        existingMap.set(`${cp.party_id}_${cp.role}`, cp);
      });

      const partyReq = buildPartyRequest();
      const keepKeys = new Set(partyReq.map(p => `${p.party_id}_${p.role}`));

      for (const [key, cp] of existingMap) {
        if (!keepKeys.has(key)) {
          try {
            await partyAPI.unlinkFromCase(id, cp.party_id, cp.role);
          } catch (e) {}
        }
      }

      if (partyReq.length) {
        await partyAPI.batchLinkToCase(id, { parties: partyReq });
      }
    } catch (e) {
      console.warn('保存当事人关联失败:', e.message);
    }
  };

  const updatePartyRole = (partyId, field, value) => {
    setPartyRoles(prev => ({
      ...prev,
      [partyId]: { ...prev[partyId], [field]: value }
    }));
  };

  const stepItems = [
    { title: '基本信息', icon: <FileTextOutlined /> },
    { title: '关联当事人', icon: <PlusOutlined /> }
  ];

  const renderPartyRoleEditor = () => {
    if (selectedParties.length === 0) {
      return <Alert type="info" message="请从左侧选择要关联的当事人" />;
    }

    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left" style={{ marginTop: 0 }}>
          配置当事人诉讼角色 ({selectedParties.length}人)
        </Divider>
        {selectedParties.map(partyId => {
          const party = allParties.find(p => p.id === partyId);
          const roleInfo = partyRoles[partyId] || {};
          if (!party) return null;
          return (
            <Card
              key={partyId}
              size="small"
              style={{ marginBottom: 8 }}
              title={
                <Space>
                  <span>{party.name}</span>
                  <Tag>{PARTY_TYPE_OPTIONS.find(t => t.value === party.type)?.label || party.type}</Tag>
                  {party.phone && <Text type="secondary">{party.phone}</Text>}
                </Space>
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="诉讼角色" style={{ marginBottom: 0 }}>
                    <Select
                      value={roleInfo.role || 'plaintiff'}
                      onChange={v => updatePartyRole(partyId, 'role', v)}
                    >
                      {PARTY_ROLE_OPTIONS.map(o => (
                        <Option key={o.value} value={o.value}>{o.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="是否我方客户" style={{ marginBottom: 0 }}>
                    <Switch
                      checked={roleInfo.is_our_client !== 0}
                      onChange={c => updatePartyRole(partyId, 'is_our_client', c ? 1 : 0)}
                      checkedChildren="是"
                      unCheckedChildren="否"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="对方律师姓名" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="非我方客户时填写"
                      value={roleInfo.attorney_name || ''}
                      onChange={e => updatePartyRole(partyId, 'attorney_name', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="对方律师电话" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="非我方客户时填写"
                      value={roleInfo.attorney_phone || ''}
                      onChange={e => updatePartyRole(partyId, 'attorney_phone', e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(isEdit ? `/cases/${id}` : '/cases')}
        >
          返回
        </Button>
        <span className="page-title" style={{ marginLeft: 8 }}>
          {isEdit ? '编辑案件' : '创建新案件'}
        </span>
      </div>

      <Steps
        current={selectedParties.length > 0 ? 1 : 0}
        items={stepItems}
        style={{ marginBottom: 24, maxWidth: 500 }}
      />

      <Form
        form={form}
        layout="vertical"
        size="large"
        loading={loading}
        style={{ maxWidth: 1600 }}
      >
        <Card title="案件基本信息" className="card-shadow mb-16">
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="case_number"
                label="案件编号"
                rules={[{ required: true, message: '请输入案件编号' }]}
              >
                <Input placeholder="系统自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="case_name"
                label="案件名称"
                rules={[{ required: true, message: '请输入案件名称' }]}
              >
                <Input placeholder="如：张三诉李四合同纠纷案" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="case_type"
                label="案件类型"
                rules={[{ required: true, message: '请选择案件类型' }]}
              >
                <Select onChange={fetchTemplates}>
                  {CASE_TYPE_OPTIONS.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="案件状态"
                rules={[{ required: true, message: '请选择案件状态' }]}
              >
                <Select>
                  {CASE_STATUS_OPTIONS.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cause_of_action" label="案由">
                <Input placeholder="如：买卖合同纠纷" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="court" label="受理法院">
                <Input placeholder="如：北京市朝阳区人民法院" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="judge" label="主审法官">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="opposing_party" label="对方当事人">
                <Input placeholder="对方当事人姓名或名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="filing_date" label="立案日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="closing_date" label="结案日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lead_lawyer_id" label="主办律师">
                <Select showSearch optionFilterProp="label">
                  {lawyers.map(l => (
                    <Option key={l.id} value={l.id} label={l.real_name}>{l.real_name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="case_fee" label="案件费用(元)">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fee_status" label="缴费状态">
                <Select>
                  {FEE_STATUS_OPTIONS.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="案件描述">
            <TextArea rows={4} placeholder="详细描述案件背景、争议焦点等" />
          </Form.Item>

          <Form.Item name="client_demand" label="客户诉求">
            <TextArea rows={3} placeholder="客户的主要诉讼请求和期望" />
          </Form.Item>
        </Card>

        <Card title="关联当事人" className="card-shadow mb-16"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              const url = '/parties/create';
              window.open(url, '_blank');
            }}>
              新建当事人
            </Button>
          }
        >
          <Transfer
            dataSource={allParties}
            targetKeys={selectedParties}
            onChange={setSelectedParties}
            rowKey={record => record.id}
            showSearch
            showSelectAll
            filterOption={(inputValue, item) =>
              (item.name || '').toLowerCase().includes(inputValue.toLowerCase()) ||
              (item.id_card || '').includes(inputValue) ||
              (item.phone || '').includes(inputValue) ||
              (item.company_name || '').toLowerCase().includes(inputValue.toLowerCase())
            }
            titles={['待选当事人', '已选当事人']}
            listStyle={{ width: 'calc(50% - 80px)', height: 300 }}
            render={item => ({
              label: (
                <Space>
                  <span>{item.name}</span>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    {PARTY_TYPE_OPTIONS.find(t => t.value === item.type)?.label}
                  </Tag>
                  {item.phone && <Text type="secondary" style={{ fontSize: 12 }}>{item.phone}</Text>}
                </Space>
              ),
              key: item.id
            })}
          />
          {renderPartyRoleEditor()}
        </Card>

        {!isEdit && (
          <Card className="card-shadow mb-16">
            <Checkbox
              checked={autoGenerateMilestones}
              onChange={e => setAutoGenerateMilestones(e.target.checked)}
            >
              提交时根据案件类型自动生成关键节点 (当前模板：{templates.length} 个)
            </Checkbox>
            {autoGenerateMilestones && templates.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                message="将自动生成以下节点"
                description={
                  <Space wrap>
                    {templates.map(t => (
                      <Tag key={t.id} color="blue">
                        {t.name}
                        {t.default_deadline_days > 0 ? ` (+${t.default_deadline_days}天)` : ''}
                      </Tag>
                    ))}
                  </Space>
                }
              />
            )}
          </Card>
        )}

        <Space size="large">
          <Button
            size="large"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => doSubmit('draft')}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={() => doSubmit('submit')}
          >
            {isEdit ? '保存并提交' : '提交案件'}
          </Button>
          <Button size="large" onClick={() => navigate(isEdit ? `/cases/${id}` : '/cases')}>
            取消
          </Button>
        </Space>
      </Form>
    </div>
  );
}

export default CaseCreate;
