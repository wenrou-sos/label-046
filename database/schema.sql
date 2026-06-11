-- ============================================================
-- 律师事务所案件管理系统 数据库脚本
-- Database: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS law_case_management
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE law_case_management;

-- -----------------------------------------------------------
-- 用户表 (律师/管理员)
-- -----------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录用户名',
  password VARCHAR(255) NOT NULL COMMENT '加密密码',
  real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  role ENUM('admin', 'lawyer', 'assistant') DEFAULT 'lawyer' COMMENT '角色',
  avatar VARCHAR(255) COMMENT '头像URL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT DEFAULT 1 COMMENT '是否启用:1是0否'
) ENGINE=InnoDB COMMENT='用户表';

-- -----------------------------------------------------------
-- 案件表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS cases;
CREATE TABLE cases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_number VARCHAR(50) UNIQUE NOT NULL COMMENT '案件编号',
  case_name VARCHAR(200) NOT NULL COMMENT '案件名称',
  case_type ENUM('civil', 'criminal', 'administrative', 'commercial', 'labor', 'family', 'other') 
    DEFAULT 'civil' COMMENT '案件类型',
  cause_of_action VARCHAR(200) COMMENT '案由',
  court VARCHAR(200) COMMENT '受理法院',
  judge VARCHAR(50) COMMENT '主审法官',
  status ENUM('draft', 'pending', 'accepted', 'hearing', 'judgment', 'appeal', 'closed', 'suspended') 
    DEFAULT 'draft' COMMENT '案件状态',
  description TEXT COMMENT '案件描述',
  filing_date DATE COMMENT '立案日期',
  closing_date DATE COMMENT '结案日期',
  lead_lawyer_id INT COMMENT '主办律师ID',
  assistant_lawyer_ids JSON COMMENT '协办律师ID数组',
  client_demand TEXT COMMENT '客户诉求',
  opposing_party VARCHAR(200) COMMENT '对方当事人',
  case_fee DECIMAL(12,2) DEFAULT 0 COMMENT '案件费用',
  fee_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' COMMENT '缴费状态',
  created_by INT COMMENT '创建人ID',
  updated_by INT COMMENT '更新人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_status (status),
  INDEX idx_case_type (case_type),
  INDEX idx_filing_date (filing_date),
  FOREIGN KEY (lead_lawyer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='案件表';

-- -----------------------------------------------------------
-- 当事人表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS parties;
CREATE TABLE parties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '当事人姓名/名称',
  type ENUM('individual', 'company', 'organization') DEFAULT 'individual' COMMENT '类型',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别(自然人)',
  id_card VARCHAR(20) UNIQUE COMMENT '身份证号(自然人)',
  company_name VARCHAR(200) COMMENT '公司名称(企业)',
  unified_social_credit VARCHAR(50) UNIQUE COMMENT '统一社会信用代码',
  legal_representative VARCHAR(50) COMMENT '法定代表人',
  phone VARCHAR(20) COMMENT '联系电话',
  email VARCHAR(100) COMMENT '电子邮箱',
  address VARCHAR(500) COMMENT '联系地址',
  occupation VARCHAR(100) COMMENT '职业',
  nationality VARCHAR(50) COMMENT '国籍',
  remark TEXT COMMENT '备注',
  created_by INT COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_name (name),
  INDEX idx_type (type)
) ENGINE=InnoDB COMMENT='当事人表';

-- -----------------------------------------------------------
-- 案件-当事人关联表 (多对多)
-- -----------------------------------------------------------
DROP TABLE IF EXISTS case_parties;
CREATE TABLE case_parties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL,
  party_id INT NOT NULL,
  role ENUM('plaintiff', 'defendant', 'third_party', 'appellant', 'appellee', 'witness') 
    DEFAULT 'plaintiff' COMMENT '诉讼角色',
  is_our_client TINYINT DEFAULT 1 COMMENT '是否我方客户:1是0否',
  attorney_name VARCHAR(50) COMMENT '对方律师姓名',
  attorney_phone VARCHAR(20) COMMENT '对方律师电话',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_case_party (case_id, party_id, role),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='案件-当事人关联表';

-- -----------------------------------------------------------
-- 卷宗分类表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS document_categories;
CREATE TABLE document_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  parent_id INT DEFAULT NULL COMMENT '父级分类ID',
  sort_order INT DEFAULT 0 COMMENT '排序',
  description VARCHAR(500) COMMENT '描述',
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES document_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='卷宗分类表';

-- 初始化默认分类
INSERT INTO document_categories (name, sort_order, description) VALUES
('起诉状类', 1, '起诉状、上诉状、申诉状等'),
('证据材料', 2, '各类证据、证明文件'),
('裁判文书', 3, '判决书、裁定书、调解书等'),
('代理文书', 4, '代理词、辩护词、法律意见书等'),
('委托手续', 5, '授权委托书、委托合同等'),
('其他材料', 99, '其他杂项材料');

-- -----------------------------------------------------------
-- 卷宗文件表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '所属案件ID',
  category_id INT COMMENT '分类ID',
  file_name VARCHAR(255) NOT NULL COMMENT '文件显示名',
  original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
  file_size BIGINT COMMENT '文件大小(字节)',
  file_type VARCHAR(100) COMMENT 'MIME类型',
  file_ext VARCHAR(20) COMMENT '文件扩展名',
  description VARCHAR(500) COMMENT '文件描述',
  page_count INT DEFAULT 0 COMMENT '页数',
  uploaded_by INT NOT NULL COMMENT '上传人ID',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  INDEX idx_case (case_id),
  INDEX idx_category (category_id),
  INDEX idx_uploaded_at (uploaded_at),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='卷宗文件表';

-- -----------------------------------------------------------
-- 关键节点模板表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS milestone_templates;
CREATE TABLE milestone_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_type ENUM('civil', 'criminal', 'administrative', 'commercial', 'labor', 'family', 'other') 
    COMMENT '适用案件类型,为空表示通用',
  name VARCHAR(100) NOT NULL COMMENT '节点名称',
  description VARCHAR(500) COMMENT '节点描述',
  default_deadline_days INT DEFAULT 0 COMMENT '默认期限天数(从立案日起)',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_system TINYINT DEFAULT 1 COMMENT '是否系统内置',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='关键节点模板表';

-- 初始化通用节点模板
INSERT INTO milestone_templates (case_type, name, description, default_deadline_days, sort_order) VALUES
(NULL, '接受委托', '与当事人签订委托合同', 0, 1),
(NULL, '立案', '向法院提交立案材料', 7, 2),
(NULL, '缴费', '缴纳诉讼费用', 14, 3),
(NULL, '提交证据', '向法院提交证据材料', 30, 4),
(NULL, '开庭审理', '法院开庭审理案件', 60, 5),
(NULL, '裁判文书送达', '收到判决书/裁定书', 90, 6),
(NULL, '上诉期', '是否提起上诉的决策期', 105, 7),
(NULL, '结案归档', '案件结案,材料归档', 120, 8);

-- -----------------------------------------------------------
-- 案件关键节点表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS milestones;
CREATE TABLE milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  case_id INT NOT NULL COMMENT '案件ID',
  template_id INT COMMENT '关联模板ID',
  name VARCHAR(100) NOT NULL COMMENT '节点名称',
  description VARCHAR(500) COMMENT '节点描述',
  status ENUM('pending', 'in_progress', 'completed', 'delayed', 'cancelled') 
    DEFAULT 'pending' COMMENT '节点状态',
  planned_date DATE COMMENT '计划完成日期',
  actual_date DATE COMMENT '实际完成日期',
  deadline_date DATE COMMENT '截止日期',
  reminder_date DATE COMMENT '提醒日期',
  assignee_id INT COMMENT '负责人ID',
  is_auto_generated TINYINT DEFAULT 0 COMMENT '是否自动生成',
  created_by INT COMMENT '创建人ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_note TEXT COMMENT '完成备注',
  INDEX idx_case (case_id),
  INDEX idx_status (status),
  INDEX idx_deadline (deadline_date),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES milestone_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='案件关键节点表';

-- -----------------------------------------------------------
-- 通知表 (超期提醒等)
-- -----------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '接收用户ID',
  type ENUM('deadline_warning', 'deadline_overdue', 'system', 'milestone', 'case_update') 
    DEFAULT 'system' COMMENT '通知类型',
  title VARCHAR(200) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  related_type ENUM('case', 'milestone', 'document', 'party') COMMENT '关联数据类型',
  related_id INT COMMENT '关联数据ID',
  is_read TINYINT DEFAULT 0 COMMENT '是否已读',
  read_at DATETIME COMMENT '阅读时间',
  send_method ENUM('system', 'email', 'sms') DEFAULT 'system' COMMENT '发送方式',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='系统通知表';

-- -----------------------------------------------------------
-- 提醒规则配置表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS reminder_rules;
CREATE TABLE reminder_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '规则名称',
  milestone_name VARCHAR(100) COMMENT '适用的节点名称,为空表示所有节点',
  warning_days INT DEFAULT 3 COMMENT '提前几天提醒',
  repeat_warning TINYINT DEFAULT 0 COMMENT '是否重复提醒',
  repeat_interval_hours INT DEFAULT 24 COMMENT '重复间隔(小时)',
  notify_methods JSON DEFAULT '["system"]' COMMENT '通知方式:system/email/sms',
  notify_roles JSON DEFAULT '["lawyer"]' COMMENT '通知角色',
  extra_user_ids JSON COMMENT '额外通知的用户ID数组',
  is_enabled TINYINT DEFAULT 1 COMMENT '是否启用',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='提醒规则配置表';

-- 初始化默认提醒规则
INSERT INTO reminder_rules (name, warning_days, notify_methods, priority) VALUES
('节点临期提醒(3天)', 3, '["system","email"]', 'medium'),
('节点临期紧急提醒(1天)', 1, '["system","email","sms"]', 'high'),
('超期节点持续提醒', 0, '["system","email"]', 'urgent');

-- -----------------------------------------------------------
-- 系统操作日志表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS operation_logs;
CREATE TABLE operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '操作人ID',
  module VARCHAR(50) COMMENT '模块',
  action VARCHAR(50) COMMENT '操作',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT COMMENT '目标ID',
  detail TEXT COMMENT '操作详情(JSON)',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  user_agent VARCHAR(500) COMMENT 'UA',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB COMMENT='操作日志表';

-- -----------------------------------------------------------
-- 初始化管理员用户 (密码: admin123, 需要bcrypt加密)
-- 实际密码加密: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- -----------------------------------------------------------
INSERT INTO users (username, password, real_name, email, phone, role, is_active) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'admin@lawfirm.com', '13800000000', 'admin', 1),
('lawyer01', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张律师', 'zhang@lawfirm.com', '13800000001', 'lawyer', 1),
('lawyer02', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李律师', 'li@lawfirm.com', '13800000002', 'lawyer', 1);
