import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, Button, Space, Row, Col, App, Tabs, Divider
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { partyAPI } from '../../api';
import { PARTY_TYPE_OPTIONS, GENDER_OPTIONS } from '../../utils/constants';

const { Option } = Select;
const { TextArea } = Input;

function PartyCreate() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [partyType, setPartyType] = useState('individual');

  useEffect(() => {
    if (isEdit) {
      fetchDetail();
    }
  }, [id]);

  useEffect(() => {
    const type = Form.useWatch?.('type', form) || partyType;
    setPartyType(type);
  }, [form]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await partyAPI.get(id);
      const data = res.data || {};
      form.setFieldsValue(data);
      setPartyType(data.type || 'individual');
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEdit) {
        await partyAPI.update(id, values);
        message.success('当事人信息更新成功');
      } else {
        await partyAPI.create(values);
        message.success('当事人创建成功');
      }
      navigate('/parties');
    } catch (e) {}
  };

  const onValuesChange = (changedValues) => {
    if (changedValues.type) {
      setPartyType(changedValues.type);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/parties')}>
          返回列表
        </Button>
        <span className="page-title" style={{ marginLeft: 8 }}>
          {isEdit ? '编辑当事人' : '新建当事人'}
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={onSubmit}
        loading={loading}
        onValuesChange={onValuesChange}
        initialValues={{ type: 'individual', gender: 'unknown' }}
      >
        <Card className="card-shadow mb-16">
          <Tabs
            activeKey={partyType}
            onChange={key => { form.setFieldsValue({ type: key }); setPartyType(key); }}
            items={[
              {
                key: 'individual',
                label: <span><UserOutlined /> 自然人</span>
              },
              {
                key: 'company',
                label: <span><BankOutlined /> 企业法人</span>
              },
              {
                key: 'organization',
                label: <span><BankOutlined /> 其他组织</span>
              }
            ]}
            style={{ marginBottom: 24 }}
          />

          <Form.Item name="type" hidden><Input /></Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={partyType === 'company' ? '企业/组织名称' : partyType === 'organization' ? '组织名称' : '姓名'}
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder={partyType === 'company' ? '请输入企业全称' : partyType === 'organization' ? '请输入组织名称' : '请输入真实姓名'} />
              </Form.Item>
            </Col>

            {partyType === 'individual' ? (
              <>
                <Col span={12}>
                  <Form.Item name="gender" label="性别">
                    <Select options={GENDER_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="id_card" label="身份证号">
                    <Input placeholder="请输入18位身份证号码" maxLength={18} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="occupation" label="职业">
                    <Input placeholder="请输入职业" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="nationality" label="国籍">
                    <Input placeholder="请输入国籍" defaultValue="中国" />
                  </Form.Item>
                </Col>
              </>
            ) : (
              <>
                <Col span={12}>
                  <Form.Item name="company_name" label={partyType === 'company' ? '工商注册名称' : '组织机构名称'}>
                    <Input placeholder="请输入完整注册名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="unified_social_credit" label={partyType === 'company' ? '统一社会信用代码' : '组织机构代码'}>
                    <Input placeholder="请输入18位代码" maxLength={18} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="legal_representative" label="法定代表人/负责人">
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
              </>
            )}

            <Col span={12}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="电子邮箱">
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="联系地址">
            <TextArea rows={2} placeholder="请输入详细联系地址" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="可记录其他相关信息" />
          </Form.Item>
        </Card>

        <Space size="large">
          <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
            {isEdit ? '保存修改' : '创建当事人'}
          </Button>
          <Button size="large" onClick={() => navigate('/parties')}>取消</Button>
        </Space>
      </Form>
    </div>
  );
}

export default PartyCreate;
