# 律师事务所案件管理系统 ⚖️

一套功能完善的律师事务所案件全流程管理系统，采用 React + Node.js + MySQL 技术栈开发。

## 📋 功能特性

### 1. 案件创建模块
- ✅ 案件信息录入（案件类型、案由、受理法院、案件状态等）
- ✅ 保存草稿功能
- ✅ 提交审核功能
- ✅ 自动生成案件编号
- ✅ 主办/协办律师分配

### 2. 当事人管理模块
- ✅ 当事人信息CRUD（自然人/企业/组织三种类型）
- ✅ 案件与当事人多对多关联
- ✅ 支持单个/批量添加当事人
- ✅ 批量导入（CSV/TXT格式）
- ✅ 诉讼角色配置（原告/被告/第三人等）
- ✅ 查看关联案件详情

### 3. 卷宗管理模块
- ✅ 多格式文件上传（PDF/Word/Excel/图片/TXT/压缩包等）
- ✅ 在线预览（PDF/图片/TXT）
- ✅ 文件下载
- ✅ 卷宗分类管理
- ✅ 记录上传时间和上传人信息
- ✅ 拖拽上传、多文件批量上传
- ✅ 上传进度显示

### 4. 关键节点追踪模块
- ✅ 时间线形式展示节点进度
- ✅ 支持手动添加节点
- ✅ 系统根据模板自动生成节点
- ✅ 节点状态流转（待开始→进行中→完成/取消）
- ✅ 节点负责人分配
- ✅ 节点完成备注

### 5. 超期提醒模块
- ✅ 关键节点期限设置
- ✅ 系统通知提醒
- ✅ 邮件提醒（可配置SMTP）
- ✅ 短信提醒（预留接口）
- ✅ 自定义提醒规则
- ✅ 提前天数配置（支持1/3/7/15/30天等）
- ✅ 重复提醒配置
- ✅ 优先级配置
- ✅ 定时自动扫描（每天8/12/18点）
- ✅ 手动触发检查

## 🏗️ 技术架构

### 前端
- **框架**: React 18
- **构建工具**: Vite 5
- **UI组件库**: Ant Design 5
- **路由**: React Router DOM 6
- **状态管理**: Zustand 4
- **HTTP请求**: Axios
- **图表**: ECharts + echarts-for-react
- **日期处理**: Day.js

### 后端
- **框架**: Node.js + Express 4
- **ORM**: Sequelize 6
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcryptjs
- **文件上传**: Multer
- **定时任务**: node-cron
- **邮件**: Nodemailer
- **跨域**: CORS

## 📁 项目结构

```
label-046/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── api/               # API接口封装
│   │   ├── layouts/           # 布局组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── cases/         # 案件管理
│   │   │   ├── parties/       # 当事人管理
│   │   │   ├── documents/     # 卷宗管理
│   │   │   ├── milestones/    # 节点追踪
│   │   │   ├── notifications/ # 通知消息
│   │   │   ├── settings/      # 系统设置
│   │   │   ├── Dashboard.jsx  # 工作台
│   │   │   ├── Login.jsx      # 登录页
│   │   │   └── Profile.jsx    # 个人中心
│   │   ├── store/             # 状态管理
│   │   ├── styles/            # 全局样式
│   │   ├── utils/             # 工具函数
│   │   ├── App.jsx            # 应用入口
│   │   └── main.jsx           # 渲染入口
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # 后端项目
│   ├── config/                # 配置文件
│   ├── middleware/            # 中间件
│   ├── models/                # Sequelize模型
│   ├── routes/                # API路由
│   ├── services/              # 业务服务
│   ├── utils/                 # 工具函数
│   ├── .env                   # 环境变量
│   ├── index.js               # 服务入口
│   └── package.json
│
├── database/                  # 数据库脚本
│   └── schema.sql             # 建表脚本+初始化数据
│
└── package.json               # 根配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- npm >= 8 或 yarn >= 1.22

### 第一步：数据库初始化

1. 确保MySQL服务已启动
2. 执行数据库脚本：
```bash
mysql -u root -p < database/schema.sql
```
> 脚本会自动创建数据库 `law_case_management` 及所有表，并插入初始化数据。

3. 修改后端配置文件 `server/.env`：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=law_case_management
```

### 第二步：安装依赖

**方式一：一键安装（推荐）**
```bash
# 在项目根目录执行
npm install
```

**方式二：分别安装**
```bash
# 安装后端依赖
cd server
npm install
cd ..

# 安装前端依赖
cd client
npm install
cd ..
```

### 第三步：启动服务

**方式一：一键启动（前后端同时启动）**
```bash
npm run dev
```

**方式二：分别启动**

```bash
# 启动后端服务 (端口 3001)
cd server
npm run dev

# 另开终端启动前端 (端口 3000)
cd client
npm start
```

### 第四步：访问系统

浏览器打开: **http://localhost:3000**

### 预置账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 系统超级管理员，拥有全部权限 |
| lawyer01 | admin123 | 律师 | 张律师，可创建和管理自己的案件 |
| lawyer02 | admin123 | 律师 | 李律师 |

## 🔧 API 接口文档

### 基础地址
后端API基础地址: `http://localhost:3001/api`

所有接口（除登录注册外）需在请求头携带JWT：
```
Authorization: Bearer <token>
```

### 核心接口列表

#### 认证模块
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新个人信息
- `POST /api/auth/logout` - 退出登录

#### 案件管理
- `GET /api/cases` - 获取案件列表（分页）
- `GET /api/cases/:id` - 获取案件详情
- `POST /api/cases` - 创建案件
- `PUT /api/cases/:id` - 更新案件
- `PATCH /api/cases/:id/status` - 更新案件状态
- `PATCH /api/cases/:id/save-draft` - 保存草稿
- `PATCH /api/cases/:id/submit` - 提交案件
- `DELETE /api/cases/:id` - 删除案件
- `GET /api/cases/stats/overview` - 案件概览统计

#### 当事人管理
- `GET /api/parties` - 获取当事人列表
- `GET /api/parties/all` - 获取全部当事人
- `GET /api/parties/:id` - 获取当事人详情
- `POST /api/parties` - 创建当事人
- `POST /api/parties/batch` - 批量创建当事人
- `PUT /api/parties/:id` - 更新当事人
- `DELETE /api/parties/:id` - 删除当事人
- `GET /api/parties/case/:caseId` - 获取案件关联当事人
- `POST /api/parties/case/:caseId/link` - 关联单个当事人
- `POST /api/parties/case/:caseId/batch-link` - 批量关联当事人
- `DELETE /api/parties/case/:caseId/unlink/:partyId` - 解除关联

#### 卷宗管理
- `GET /api/documents` - 获取文件列表
- `GET /api/documents/:id` - 获取文件详情
- `POST /api/documents/upload` - 单文件上传
- `POST /api/documents/upload-multiple` - 多文件上传
- `PUT /api/documents/:id` - 更新文件信息
- `DELETE /api/documents/:id` - 删除文件
- `GET /api/documents/:id/download` - 下载文件
- `GET /api/documents/:id/preview` - 预览文件信息

#### 卷宗分类
- `GET /api/categories` - 获取分类列表
- `GET /api/categories/tree` - 获取分类树
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

#### 关键节点
- `GET /api/milestones` - 获取节点列表
- `GET /api/milestones/timeline/:caseId` - 获取案件时间线
- `GET /api/milestones/:id` - 获取节点详情
- `POST /api/milestones` - 创建节点
- `POST /api/milestones/generate-from-template/:caseId` - 根据模板生成节点
- `PUT /api/milestones/:id` - 更新节点
- `PATCH /api/milestones/:id/status` - 更新节点状态
- `DELETE /api/milestones/:id` - 删除节点

#### 通知消息
- `GET /api/notifications` - 获取通知列表
- `GET /api/notifications/unread-count` - 获取未读数
- `POST /api/notifications/:id/read` - 标记已读
- `POST /api/notifications/read-all` - 全部已读
- `DELETE /api/notifications/:id` - 删除通知

#### 提醒规则
- `GET /api/reminder-rules` - 获取规则列表
- `GET /api/reminder-rules/all` - 获取所有启用规则
- `POST /api/reminder-rules` - 创建规则
- `PUT /api/reminder-rules/:id` - 更新规则
- `PATCH /api/reminder-rules/:id/toggle` - 开关规则
- `DELETE /api/reminder-rules/:id` - 删除规则
- `POST /api/reminder-rules/run-check` - 手动触发检查

#### 统计数据
- `GET /api/statistics/dashboard` - 工作台统计数据
- `GET /api/statistics/cases-trend` - 案件趋势
- `GET /api/statistics/fee-stats` - 费用统计

## 📊 数据库设计

### 核心数据表

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| users | 用户表 | username, password, real_name, role, email, phone |
| cases | 案件表 | case_number, case_name, case_type, status, court, lead_lawyer_id |
| parties | 当事人表 | name, type, id_card, company_name, phone, email, address |
| case_parties | 案件-当事人关联 | case_id, party_id, role(诉讼角色), is_our_client |
| documents | 卷宗文件表 | case_id, category_id, file_name, file_path, file_size, uploaded_by |
| document_categories | 卷宗分类 | name, parent_id, sort_order |
| milestones | 关键节点 | case_id, name, status, planned_date, deadline_date, assignee_id |
| milestone_templates | 节点模板 | case_type, name, default_deadline_days |
| notifications | 通知表 | user_id, type, title, content, is_read |
| reminder_rules | 提醒规则 | name, warning_days, notify_methods, priority |
| operation_logs | 操作日志 | user_id, module, action, detail |

详细表结构请查看 [database/schema.sql](database/schema.sql)

## ⚙️ 高级配置

### 邮件通知配置
在 `server/.env` 中配置SMTP参数：
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_email@qq.com
SMTP_PASS=your_smtp_auth_code
SMTP_FROM=律师事务所管理系统 <your_email@qq.com>
```

### 短信通知配置
预留了短信接口，需在 `server/services/reminderService.js` 的 `sendSmsNotification` 方法中接入实际短信服务商API。

### 自定义定时任务
默认提醒检查时间为每天 08:00、12:00、18:00，可在 `server/.env` 中通过 `REMINDER_CRON` 修改（使用cron表达式）。

## 🎨 界面预览

系统包含以下核心页面：
- **登录页** - 专业渐变背景登录界面
- **工作台** - 案件统计图表、即将到期/已超期节点、最新通知
- **案件列表** - 多维度筛选、表格展示、快速操作
- **案件创建** - 步骤引导、当事人Transfer选择、角色配置
- **案件详情** - 基本信息、当事人、卷宗、节点时间线
- **当事人列表** - 个人/企业双模式、批量导入、详情抽屉
- **卷宗管理** - 多格式支持、拖拽上传、在线预览
- **节点追踪** - 统计卡片、到期预警、状态更新
- **提醒规则** - 自定义规则、手动触发检查
- **消息中心** - 消息分类、未读标记、一键跳转

## 🔒 安全说明

- 密码使用 bcryptjs 加密存储
- JWT Token 认证，支持过期自动登出
- 接口权限中间件校验
- 用户状态（启用/禁用）控制
- SQL注入防护（Sequelize ORM参数化查询）
- XSS防护（输入验证+输出转义）
- 文件上传类型和大小限制

## 📝 更新日志

### v1.0.0 (2024-06-11)
- ✅ 完成全部5个核心功能模块
- ✅ 前后端完整分离架构
- ✅ 完整的RESTful API
- ✅ 多角色权限控制
- ✅ 专业级UI界面
- ✅ 数据库完整设计文档
- ✅ 超期提醒定时任务
- ✅ 工作台数据统计图表

## 📮 问题反馈

如有问题或建议，欢迎提出Issue。

---

**⚖️ 专业、高效、安全的案件全流程管理平台**
