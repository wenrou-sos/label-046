import React, { useState, useEffect } from 'react';
import {
  Card, Descriptions, Tag, Avatar, Button, Space, Row, Col, Empty, Spin,
  Tabs, List, Table, Modal, App, Tooltip, Popconfirm, Divider, Upload, Input, Select, Timeline, Progress,
  DatePicker, Typography
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  EyeOutlined, DownloadOutlined, DeleteTwoTone, ClockCircleOutlined,
  CheckCircleTwoTone, ExclamationCircleTwoTone, FileOutlined,
  FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined,
  FileZipOutlined, FileTextOutlined, UserOutlined, UploadOutlined,
  UnlinkOutlined, LinkOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  caseAPI, partyAPI, documentAPI, categoryAPI, milestoneAPI, milestoneTemplateAPI, userAPI
} from '../../api';
import {
  CASE_TYPE_OPTIONS, CASE_STATUS_OPTIONS, FEE_STATUS_OPTIONS,
  PARTY_ROLE_OPTIONS, PARTY_TYPE_OPTIONS, MILESTONE_STATUS_OPTIONS,
  getOptionLabel, getOptionColor
} from '../../utils/constants';
import {
  formatDate, formatDateTime, formatFileSize, formatCurrency, getFileIcon,
  canPreviewInline, daysUntil
} from '../../utils/helpers';
import MilestoneTimeline from '../milestones/MilestoneTimeline';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [parties, setParties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [allParties, setAllParties] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [linkPartyModal, setLinkPartyModal] = useState(false);
  const [linkPartyForm, setLinkPartyForm] = useState({});
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ category_id: null, fileList: [] });
  const [addMilestoneModal, setAddMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchAll();
    fetchCategories();
    fetchLawyers();
    fetchAllParties();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await caseAPI.get(id);
      const data = res.data || {};
      setCaseData(data);
      setParties(data.case_parties || []);
      setDocuments(data.documents || []);
      setMilestones(data.milestones || []);

      const res2 = await milestoneTemplateAPI.list({ case_type: data.case_type || undefined });
      setTemplates(res2.data || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.list();
      setCategories(res.data || []);
    } catch (e) {}
  };

  const fetchLawyers = async () => {
    try {
      const res = await userAPI.getLawyers();
      setLawyers(res.data || []);
    } catch (e) {}
  };

  const fetchAllParties = async () => {
    try {
      const res = await partyAPI.all();
      setAllParties(res.data || []);
    } catch (e) {}
  };

  const handleStatusChange = async (status) => {
    try {
      await caseAPI.updateStatus(id, status);
      message.success('状态更新成功');
      fetchAll();
    } catch (e) {}
  };

  const confirmDelete = () => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除案件「${caseData?.case_name}」吗？此操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          await caseAPI.delete(id);
          message.success('案件删除成功');
          navigate('/cases');
        } catch (e) {}
      }
    });
  };

  const handleLinkParty = async () => {
    try {
      const { party_id, role, is_our_client, attorney_name, attorney_phone } = linkPartyForm;
      if (!party_id) {
        message.warning('请选择当事人');
        return;
      }
      await partyAPI.linkToCase(id, {
        party_id, role, is_our_client, attorney_name, attorney_phone
      });
      message.success('关联成功');
      setLinkPartyModal(false);
      setLinkPartyForm({});
      fetchAll();
    } catch (e) {}
  };

  const handleUnlinkParty = async (partyId, role) => {
    modal.confirm({
      title: '确认解除关联',
      content: '确定要解除该当事人的关联吗？',
      okType: 'danger',
      onOk: async () => {
        try {
          await partyAPI.unlinkFromCase(id, partyId, role);
          message.success('已解除关联');
          fetchAll();
        } catch (e) {}
      }
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.fileList || uploadForm.fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('case_id', id);
      if (uploadForm.category_id) formData.append('category_id', uploadForm.category_id);
      uploadForm.fileList.forEach(file => {
        formData.append('files', file.originFileObj);
      });
      await documentAPI.uploadMultiple(formData);
      message.success('文件上传成功');
      setUploadModal(false);
      setUploadForm({ category_id: null, fileList: [] });
      fetchAll();
    } catch (e) {} finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await documentAPI.delete(docId);
      message.success('文件删除成功');
      fetchAll();
    } catch (e) {}
  };

  const handlePreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewModal(true);
  };

  const handleAddMilestone = async () => {
    try {
      if (!milestoneForm.name) {
        message.warning('请输入节点名称');
        return;
      }
      await milestoneAPI.create({
        ...milestoneForm,
        case_id: id
      });
      message.success('节点创建成功');
      setAddMilestoneModal(false);
      setMilestoneForm({});
      fetchAll();
    } catch (e) {}
  };

  const handleGenerateMilestones = async () => {
    modal.confirm({
      title: '自动生成节点',
      content: `将根据案件类型「${getOptionLabel(CASE_TYPE_OPTIONS, caseData?.case_type)}」的模板自动生成 ${templates.length} 个关键节点，是否继续？`,
      onOk: async () => {
        try {
          await milestoneAPI.generateFromTemplate(id, {
            case_type: caseData?.case_type,
            filing_date: caseData?.filing_date
          });
          message.success('节点生成成功');
          fetchAll();
        } catch (e) {}
      }
    });
  };

  const handleMilestoneStatusChange = async (milestoneId, status) => {
    try {
      await milestoneAPI.updateStatus(milestoneId, status);
      message.success('状态更新成功');
      fetchAll();
    } catch (e) {}
  };

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const totalCount = milestones.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const progressStatus = progress === 100 ? 'success' : progress > 50 ? 'active' : 'normal';

  const documentColumns = [
    { title: '文件名', dataIndex: 'file_name', ellipsis: true,
      render: (v, record) => (
        <Space>
          {renderFileIcon(record.file_ext)}
          <a onClick={() => handlePreview(record)}>{v}</a>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      render: v => v ? <Tag>{v}</Tag> : <Tag color="default">未分类</Tag>,
      width: 100
    },
    { title: '大小', dataIndex: 'file_size', width: 100, render: v => formatFileSize(v) },
    { title: '上传人', dataIndex: ['uploader', 'real_name'], width: 100 },
    { title: '上传时间', dataIndex: 'uploaded_at', width: 160, render: v => formatDateTime(v) },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {canPreviewInline(record.file_ext) && (
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
              预览
            </Button>
          )}
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            <a href={documentAPI.download(record.id)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
              下载
            </a>
          </Button>
          <Popconfirm title="确定删除？" okType="danger" onConfirm={() => handleDeleteDoc(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderFileIcon = (ext) => {
    const e = (ext || '').toLowerCase();
    const iconProps = { style: { fontSize: 20, color: '#1890ff' } };
    if (e === 'pdf') return <FilePdfOutlined {...iconProps} style={{ ...iconProps.style, color: '#ff4d4f' }} />;
    if (['doc', 'docx'].includes(e)) return <FileWordOutlined {...iconProps} style={{ ...iconProps.style, color: '#1890ff' }} />;
    if (['xls', 'xlsx'].includes(e)) return <FileExcelOutlined {...iconProps} style={{ ...iconProps.style, color: '#52c41a' }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(e)) return <FileImageOutlined {...iconProps} style={{ ...iconProps.style, color: '#722ed1' }} />;
    if (['zip', 'rar', '7z'].includes(e)) return <FileZipOutlined {...iconProps} style={{ ...iconProps.style, color: '#fa8c16' }} />;
    if (e === 'txt') return <FileTextOutlined {...iconProps} />;
    return <FileOutlined {...iconProps} />;
  };

  const statusActions = (
    <Select
      size="small"
      style={{ width: 120 }}
      value={caseData?.status}
      onChange={handleStatusChange}
      options={CASE_STATUS_OPTIONS}
    />
  );

  const tabs = [
    {
      key: 'parties',
      label: (
        <span><UserOutlined /> 当事人 ({parties.length})</span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<LinkOutlined />} onClick={() => setLinkPartyModal(true)}>
              关联当事人
            </Button>
            <Button style={{ marginLeft: 8 }} icon={<PlusOutlined />} onClick={() => window.open('/parties/create', '_blank')}>
              新建当事人
            </Button>
          </div>
          {parties.length === 0 ? (
            <Empty description="暂无关联当事人" />
          ) : (
            <Row gutter={[16, 16]}>
              {parties.map(cp => (
                <Col xs={24} sm={12} md={8} lg={6} key={`${cp.party_id}-${cp.role}`}>
                  <Card
                    size="small"
                    className="card-shadow"
                    title={
                      <Space wrap>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{cp.party_info?.name}</span>
                        <Tag color={cp.is_our_client ? 'green' : 'red'}>
                          {getOptionLabel(PARTY_ROLE_OPTIONS, cp.role)}
                        </Tag>
                      </Space>
                    }
                    actions={[
                      <Popconfirm title="解除关联？" okType="danger" onConfirm={() => handleUnlinkParty(cp.party_id, cp.role)}>
                        <span><UnlinkOutlined /> 解除</span>
                      </Popconfirm>
                    ]}
                  >
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="类型">
                        {getOptionLabel(PARTY_TYPE_OPTIONS, cp.party_info?.type)}
                      </Descriptions.Item>
                      {cp.party_info?.phone && (
                        <Descriptions.Item label="电话">{cp.party_info.phone}</Descriptions.Item>
                      )}
                      {cp.attorney_name && (
                        <Descriptions.Item label="对方律师">{cp.attorney_name}</Descriptions.Item>
                      )}
                      {!cp.is_our_client && cp.attorney_phone && (
                        <Descriptions.Item label="律师电话">{cp.attorney_phone}</Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )
    },
    {
      key: 'documents',
      label: <span><FileOutlined /> 卷宗文件 ({documents.length})</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModal(true)}>
              上传文件
            </Button>
          </div>
          {documents.length === 0 ? (
            <Empty description="暂无卷宗文件" />
          ) : (
            <Table
              size="small"
              columns={documentColumns}
              dataSource={documents}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 个文件` }}
            />
          )}
        </div>
      )
    },
    {
      key: 'milestones',
      label: <span><ClockCircleOutlined /> 关键节点 ({milestones.length})</span>,
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Progress
                percent={progress}
                status={progressStatus}
                style={{ width: 300 }}
                format={p => `${p}% (${completedCount}/${totalCount})`}
              />
            </Space>
            <Space>
              {templates.length > 0 && milestones.length === 0 && (
                <Button icon={<PlusOutlined />} onClick={handleGenerateMilestones}>
                  自动生成节点
                </Button>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddMilestoneModal(true)}>
                手动添加节点
              </Button>
            </Space>
          </div>
          {milestones.length === 0 ? (
            <Empty description="暂无节点，请点击上方按钮添加或自动生成" />
          ) : (
            <MilestoneTimeline
              milestones={milestones}
              onStatusChange={handleMilestoneStatusChange}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>返回列表</Button>
            <span className="page-title">案件详情</span>
            <Tag color="blue" style={{ fontSize: 14 }}>{caseData?.case_number}</Tag>
          </Space>
          <Space>
            {statusActions}
            <Button icon={<EditOutlined />} onClick={() => navigate(`/cases/edit/${id}`)}>
              编辑案件
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={confirmDelete}>
              删除案件
            </Button>
          </Space>
        </div>

        <Card title="案件基本信息" className="card-shadow mb-16">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="案件名称" span={2}>
              <Text strong style={{ fontSize: 15 }}>{caseData?.case_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="案件类型">
              <Tag color={getOptionColor(CASE_TYPE_OPTIONS, caseData?.case_type)}>
                {getOptionLabel(CASE_TYPE_OPTIONS, caseData?.case_type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="案件状态">
              <Tag color={getOptionColor(CASE_STATUS_OPTIONS, caseData?.status)}>
                {getOptionLabel(CASE_STATUS_OPTIONS, caseData?.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="案由">{caseData?.cause_of_action || '-'}</Descriptions.Item>
            <Descriptions.Item label="受理法院">{caseData?.court || '-'}</Descriptions.Item>
            <Descriptions.Item label="主审法官">{caseData?.judge || '-'}</Descriptions.Item>
            <Descriptions.Item label="对方当事人">{caseData?.opposing_party || '-'}</Descriptions.Item>
            <Descriptions.Item label="主办律师">
              {caseData?.lead_lawyer?.real_name || <Text type="secondary">未分配</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="立案日期">{formatDate(caseData?.filing_date)}</Descriptions.Item>
            <Descriptions.Item label="结案日期">{formatDate(caseData?.closing_date)}</Descriptions.Item>
            <Descriptions.Item label="案件费用" span={2}>
              <Space>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  {formatCurrency(caseData?.case_fee)}
                </Text>
                <Tag color={getOptionColor(FEE_STATUS_OPTIONS, caseData?.fee_status)}>
                  {getOptionLabel(FEE_STATUS_OPTIONS, caseData?.fee_status)}
                </Tag>
              </Space>
            </Descriptions.Item>
            {caseData?.description && (
              <Descriptions.Item label="案件描述" span={2}>
                {caseData.description}
              </Descriptions.Item>
            )}
            {caseData?.client_demand && (
              <Descriptions.Item label="客户诉求" span={2}>
                {caseData.client_demand}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建人">
              {caseData?.creator?.real_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(caseData?.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card className="card-shadow" bodyStyle={{ paddingTop: 16 }}>
          <Tabs items={tabs} defaultActiveKey="parties" />
        </Card>

        <Modal
          title="关联当事人"
          open={linkPartyModal}
          onCancel={() => setLinkPartyModal(false)}
          onOk={handleLinkParty}
          okText="确认关联"
          width={600}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>选择当事人 <span style={{ color: 'red' }}>*</span></label>
              <Select
                showSearch
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  (option.label || '').toLowerCase().includes(input.toLowerCase())
                }
                value={linkPartyForm.party_id || undefined}
                onChange={v => setLinkPartyForm(f => ({ ...f, party_id: v }))}
                options={allParties.map(p => ({
                  value: p.id,
                  label: `${p.name} (${getOptionLabel(PARTY_TYPE_OPTIONS, p.type)})`
                }))}
              />
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>诉讼角色</label>
                <Select
                  style={{ width: '100%' }}
                  value={linkPartyForm.role || 'plaintiff'}
                  onChange={v => setLinkPartyForm(f => ({ ...f, role: v }))}
                  options={PARTY_ROLE_OPTIONS}
                />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>是否我方客户</label>
                <Select
                  style={{ width: '100%' }}
                  value={linkPartyForm.is_our_client ?? 1}
                  onChange={v => setLinkPartyForm(f => ({ ...f, is_our_client: v }))}
                  options={[
                    { value: 1, label: '是（我方）' },
                    { value: 0, label: '否（对方）' }
                  ]}
                />
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>对方律师姓名</label>
                <Input
                  placeholder="非我方客户时填写"
                  value={linkPartyForm.attorney_name || ''}
                  onChange={e => setLinkPartyForm(f => ({ ...f, attorney_name: e.target.value }))}
                />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>对方律师电话</label>
                <Input
                  value={linkPartyForm.attorney_phone || ''}
                  onChange={e => setLinkPartyForm(f => ({ ...f, attorney_phone: e.target.value }))}
                />
              </Col>
            </Row>
          </div>
        </Modal>

        <Modal
          title="上传卷宗文件"
          open={uploadModal}
          onCancel={() => setUploadModal(false)}
          onOk={handleUpload}
          confirmLoading={uploading}
          okText="开始上传"
          width={600}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>文件分类</label>
              <Select
                style={{ width: '100%' }}
                allowClear
                placeholder="选择分类（可选）"
                value={uploadForm.category_id || undefined}
                onChange={v => setUploadForm(f => ({ ...f, category_id: v }))}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                选择文件（支持PDF/Word/Excel/图片等，最大100MB）
              </label>
              <Upload.Dragger
                multiple
                fileList={uploadForm.fileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setUploadForm(f => ({ ...f, fileList }))}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar,.7z"
              >
                <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持多文件同时上传</p>
              </Upload.Dragger>
            </div>
          </div>
        </Modal>

        <Modal
          title="添加关键节点"
          open={addMilestoneModal}
          onCancel={() => setAddMilestoneModal(false)}
          onOk={handleAddMilestone}
          okText="创建节点"
          width={560}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>节点名称 <span style={{ color: 'red' }}>*</span></label>
              <Input
                placeholder="如：一审开庭"
                value={milestoneForm.name || ''}
                onChange={e => setMilestoneForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>计划日期</label>
                <DatePicker
                  style={{ width: '100%' }}
                  value={milestoneForm.planned_date ? dayjs(milestoneForm.planned_date) : null}
                  onChange={d => setMilestoneForm(f => ({
                    ...f,
                    planned_date: d?.format('YYYY-MM-DD'),
                    deadline_date: d?.format('YYYY-MM-DD')
                  }))}
                />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 4 }}>截止日期</label>
                <DatePicker
                  style={{ width: '100%' }}
                  value={milestoneForm.deadline_date ? dayjs(milestoneForm.deadline_date) : null}
                  onChange={d => setMilestoneForm(f => ({ ...f, deadline_date: d?.format('YYYY-MM-DD') }))}
                />
              </Col>
            </Row>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>负责人</label>
              <Select
                style={{ width: '100%' }}
                showSearch
                allowClear
                placeholder="选择负责人（可选）"
                value={milestoneForm.assignee_id || undefined}
                onChange={v => setMilestoneForm(f => ({ ...f, assignee_id: v }))}
                options={lawyers.map(l => ({ value: l.id, label: l.real_name }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>节点描述</label>
              <TextArea
                rows={3}
                placeholder="描述节点需要完成的工作"
                value={milestoneForm.description || ''}
                onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title={previewDoc?.file_name}
          open={previewModal}
          onCancel={() => setPreviewModal(false)}
          width={960}
          footer={[
            <Button key="download" icon={<DownloadOutlined />}>
              <a href={previewDoc ? documentAPI.download(previewDoc.id) : '#'}
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{ color: 'inherit' }}>
                下载
              </a>
            </Button>,
            <Button key="close" type="primary" onClick={() => setPreviewModal(false)}>关闭</Button>
          ]}
        >
          {previewDoc && canPreviewInline(previewDoc.file_ext) ? (
            <div className="document-preview-container">
              {['jpg', 'jpeg', 'png', 'gif'].includes(previewDoc.file_ext?.toLowerCase()) ? (
                <img
                  src={previewDoc.file_path}
                  alt={previewDoc.file_name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <iframe
                  src={previewDoc.file_path}
                  title={previewDoc.file_name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <FileOutlined style={{ fontSize: 64, color: '#999' }} />
              <div style={{ marginTop: 16, color: '#666' }}>
                该文件类型不支持在线预览，请点击下方按钮下载后查看
              </div>
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                icon={<DownloadOutlined />}
                onClick={() => {
                  if (previewDoc) window.open(documentAPI.download(previewDoc.id), '_blank');
                }}
              >
                下载文件
              </Button>
            </div>
          )}
        </Modal>
      </Spin>
    </div>
  );
}

export default CaseDetail;
