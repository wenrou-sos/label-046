import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Input, Select, DatePicker, Tag, App,
  Row, Col, Tooltip, Avatar, Empty, Modal, Upload, Progress, Spin,
  Descriptions, Drawer, Popconfirm, Statistic
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EyeOutlined,
  DownloadOutlined, DeleteOutlined, UploadOutlined, FileOutlined,
  FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined,
  FileZipOutlined, FileTextOutlined, UserOutlined, FolderOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { documentAPI, caseAPI, categoryAPI, userAPI } from '../../api';
import { formatDate, formatDateTime, formatFileSize, getFileIcon, canPreviewInline } from '../../utils/helpers';

const { RangePicker } = DatePicker;

function DocumentList() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [categories, setCategories] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);

  const [uploadModal, setUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ case_id: null, category_id: null, fileList: [], descriptions: {} });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [previewModal, setPreviewModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [detailDrawer, setDetailDrawer] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchLawyers();
    fetchCases();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

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

  const fetchCases = async () => {
    try {
      const res = await caseAPI.list({ pageSize: 1000 });
      setCases(res.data?.list || []);
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
      const res = await documentAPI.list(params);
      setData(res.data?.list || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const renderFileIcon = (ext, size = 28) => {
    const e = (ext || '').toLowerCase();
    const props = { style: { fontSize: size } };
    if (e === 'pdf') return <FilePdfOutlined {...props} twoToneColor="#ff4d4f" style={{ ...props.style, color: '#ff4d4f' }} />;
    if (['doc', 'docx'].includes(e)) return <FileWordOutlined {...props} style={{ ...props.style, color: '#1890ff' }} />;
    if (['xls', 'xlsx'].includes(e)) return <FileExcelOutlined {...props} style={{ ...props.style, color: '#52c41a' }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff'].includes(e)) return <FileImageOutlined {...props} style={{ ...props.style, color: '#722ed1' }} />;
    if (['zip', 'rar', '7z'].includes(e)) return <FileZipOutlined {...props} style={{ ...props.style, color: '#fa8c16' }} />;
    if (e === 'txt') return <FileTextOutlined {...props} />;
    return <FileOutlined {...props} style={{ ...props.style, color: '#8c8c8c' }} />;
  };

  const handlePreview = async (record) => {
    setPreviewDoc(record);
    setPreviewModal(true);
  };

  const showDetail = async (record) => {
    try {
      const res = await documentAPI.get(record.id);
      setCurrentDoc(res.data);
      setDetailDrawer(true);
    } catch (e) {}
  };

  const handleDelete = async (record) => {
    try {
      await documentAPI.delete(record.id);
      message.success('文件删除成功');
      fetchData();
    } catch (e) {}
  };

  const confirmDelete = (record) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除「${record.file_name}」吗？`,
      okType: 'danger',
      onOk: () => handleDelete(record)
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.case_id) {
      message.warning('请先选择所属案件');
      return;
    }
    if (!uploadForm.fileList || uploadForm.fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('case_id', uploadForm.case_id);
      if (uploadForm.category_id) formData.append('category_id', uploadForm.category_id);
      uploadForm.fileList.forEach(file => {
        formData.append('files', file.originFileObj);
      });
      await documentAPI.uploadMultiple(formData, (p) => setUploadProgress(p));
      message.success('文件上传成功');
      setUploadModal(false);
      setUploadForm({ case_id: null, category_id: null, fileList: [], descriptions: {} });
      setUploadProgress(0);
      fetchData();
    } catch (e) {
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      width: 260,
      render: (v, record) => (
        <Space>
          <div style={{ width: 36, textAlign: 'center' }}>
            {renderFileIcon(record.file_ext, 28)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-ellipsis" style={{ maxWidth: 200, fontWeight: 500 }}>
              <a onClick={() => canPreviewInline(record.file_ext) ? handlePreview(record) : showDetail(record)}>
                {v}
              </a>
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              原: {record.original_name}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      width: 100,
      render: v => v ? <Tag color="blue">{v}</Tag> : <Tag>未分类</Tag>
    },
    {
      title: '所属案件',
      dataIndex: ['case_info', 'case_name'],
      width: 200,
      render: (v, record) => v ? (
        <a onClick={() => navigate(`/cases/${record.case_id}`)}>
          <div className="text-ellipsis" style={{ maxWidth: 180 }}>{v}</div>
          {record.case_info?.case_number && (
            <Tag color="blue" style={{ fontSize: 11 }}>{record.case_info.case_number}</Tag>
          )}
        </a>
      ) : '-'
    },
    { title: '文件大小', dataIndex: 'file_size_formatted', width: 100, render: (v, r) => v || formatFileSize(r.file_size) },
    { title: '类型', dataIndex: 'file_ext', width: 70, render: v => v ? v.toUpperCase() : '-' },
    {
      title: '上传人',
      dataIndex: ['uploader', 'real_name'],
      width: 100,
      render: v => v || '-'
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      width: 160,
      render: v => formatDateTime(v)
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
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
          <Button type="link" size="small" onClick={() => showDetail(record)}>详情</Button>
          <Popconfirm title="确认删除？" okType="danger" onConfirm={() => confirmDelete(record)}>
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
            <div className="page-title">卷宗管理</div>
            <div className="page-subtitle">管理案件相关的所有卷宗文件，支持多格式上传、预览和下载</div>
          </div>
          <Button type="primary" icon={<UploadOutlined />} size="large" onClick={() => setUploadModal(true)}>
            上传文件
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="文件总数"
              value={total}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="卷宗分类"
              value={categories.length}
              prefix={<FileOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="近30天上传"
              value={data.filter(d => {
                const t = dayjs(d.uploaded_at);
                return dayjs().diff(t, 'day') <= 30;
              }).length || '—'}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="所属案件"
              allowClear
              showSearch
              style={{ width: '100%' }}
              optionFilterProp="label"
              value={filters.case_id || undefined}
              onChange={v => setFilters(f => ({ ...f, case_id: v }))}
              options={cases.map(c => ({ value: c.id, label: `${c.case_name} (${c.case_number})` }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="文件分类"
              allowClear
              style={{ width: '100%' }}
              value={filters.category_id || undefined}
              onChange={v => setFilters(f => ({ ...f, category_id: v }))}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="上传人"
              allowClear
              showSearch
              style={{ width: '100%' }}
              value={filters.uploaded_by || undefined}
              onChange={v => setFilters(f => ({ ...f, uploaded_by: v }))}
              options={lawyers.map(l => ({ value: l.id, label: l.real_name }))}
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]} align="middle" style={{ marginTop: 12 }}>
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
          <Col xs={24} sm={24} md={16}>
            <Space wrap>
              <Input
                allowClear
                placeholder="搜索文件名、原始文件名、描述..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onPressEnter={fetchData}
                style={{ width: 280 }}
              />
              <Button icon={<SearchOutlined />} onClick={fetchData}>搜索</Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setFilters({}); setSearchText('');
                setPagination({ current: 1, pageSize: 20 });
                setTimeout(fetchData, 0);
              }}>重置</Button>
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
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 个文件`,
            onChange: (current, pageSize) => setPagination({ current, pageSize })
          }}
        />
      </Card>

      <Modal
        title="上传卷宗文件"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        onOk={handleUpload}
        confirmLoading={uploading}
        okText={uploading ? `上传中 ${uploadProgress}%` : '开始上传'}
        width={600}
        closable={!uploading}
        maskClosable={!uploading}
      >
        <Spin spinning={uploading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                所属案件 <span style={{ color: 'red' }}>*</span>
              </label>
              <Select
                showSearch
                style={{ width: '100%' }}
                optionFilterProp="label"
                placeholder="选择要上传到哪个案件"
                value={uploadForm.case_id || undefined}
                onChange={v => setUploadForm(f => ({ ...f, case_id: v }))}
                options={cases.map(c => ({ value: c.id, label: `${c.case_name} (${c.case_number})` }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>文件分类（可选）</label>
              <Select
                style={{ width: '100%' }}
                allowClear
                placeholder="选择分类"
                value={uploadForm.category_id || undefined}
                onChange={v => setUploadForm(f => ({ ...f, category_id: v }))}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                选择文件（支持PDF/Word/Excel/图片等，单个最大100MB）
              </label>
              <Upload.Dragger
                multiple
                fileList={uploadForm.fileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setUploadForm(f => ({ ...f, fileList }))}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.tif,.tiff,.txt,.zip,.rar,.7z"
              >
                <p className="ant-upload-drag-icon" style={{ fontSize: 48 }}><UploadOutlined /></p>
                <p className="ant-upload-text" style={{ fontSize: 16 }}>点击或拖拽文件到此处上传</p>
                <p className="ant-upload-hint">支持多文件同时上传，单次最多20个</p>
              </Upload.Dragger>
            </div>
            {uploading && (
              <Progress percent={uploadProgress} status="active" />
            )}
          </div>
        </Spin>
      </Modal>

      <Modal
        title={previewDoc?.file_name}
        open={previewModal}
        onCancel={() => setPreviewModal(false)}
        width={960}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            <a href={previewDoc ? documentAPI.download(previewDoc.id) : '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>下载</a>
          </Button>,
          <Button key="close" type="primary" onClick={() => setPreviewModal(false)}>关闭</Button>
        ]}
      >
        {previewDoc && canPreviewInline(previewDoc.file_ext) ? (
          <div className="document-preview-container">
            {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff'].includes(previewDoc.file_ext?.toLowerCase()) ? (
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
              该文件类型不支持在线预览，请下载后查看
            </div>
            <Button type="primary" style={{ marginTop: 16 }} icon={<DownloadOutlined />}>
              <a href={previewDoc ? documentAPI.download(previewDoc.id) : '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                下载文件
              </a>
            </Button>
          </div>
        )}
      </Modal>

      <Drawer
        title="文件详情"
        width={520}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentDoc && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16, padding: 24, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ marginBottom: 12 }}>{renderFileIcon(currentDoc.file_ext, 64)}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{currentDoc.file_name}</div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                {formatFileSize(currentDoc.file_size)} · {currentDoc.file_ext?.toUpperCase()}
              </div>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="所属案件">
                <a onClick={() => { navigate(`/cases/${currentDoc.case_id}`); setDetailDrawer(false); }}>
                  {currentDoc.case_info?.case_name} ({currentDoc.case_info?.case_number})
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {currentDoc.category?.name || <Tag>未分类</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="原始文件名">{currentDoc.original_name}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatFileSize(currentDoc.file_size)}</Descriptions.Item>
              <Descriptions.Item label="文件类型">{currentDoc.file_type}</Descriptions.Item>
              {currentDoc.page_count > 0 && (
                <Descriptions.Item label="页数">{currentDoc.page_count} 页</Descriptions.Item>
              )}
              <Descriptions.Item label="上传人">{currentDoc.uploader?.real_name}</Descriptions.Item>
              <Descriptions.Item label="上传时间">{formatDateTime(currentDoc.uploaded_at)}</Descriptions.Item>
              {currentDoc.description && (
                <Descriptions.Item label="描述">{currentDoc.description}</Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              {canPreviewInline(currentDoc.file_ext) && (
                <Button icon={<EyeOutlined />} onClick={() => { handlePreview(currentDoc); setDetailDrawer(false); }}>
                  预览
                </Button>
              )}
              <Button icon={<DownloadOutlined />}>
                <a href={documentAPI.download(currentDoc.id)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  下载
                </a>
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default DocumentList;
