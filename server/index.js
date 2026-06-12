const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { startReminderScheduler } = require('./services/reminderService');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '律师事务所案件管理系统服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/cases', authMiddleware, require('./routes/cases'));
app.use('/api/parties', authMiddleware, require('./routes/parties'));
app.use('/api/documents', authMiddleware, require('./routes/documents'));
app.use('/api/categories', authMiddleware, require('./routes/documentCategories'));
app.use('/api/milestones', authMiddleware, require('./routes/milestones'));
app.use('/api/milestone-templates', authMiddleware, require('./routes/milestoneTemplates'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/reminder-rules', authMiddleware, require('./routes/reminderRules'));
app.use('/api/statistics', authMiddleware, require('./routes/statistics'));
app.use('/api/search', authMiddleware, require('./routes/search'));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await testConnection();
    console.log('✓ 数据库连接成功');
    
    await sequelize.sync({ alter: false });
    console.log('✓ 数据库模型同步完成');

    startReminderScheduler();
    console.log('✓ 超期提醒定时任务已启动');

    app.listen(PORT, () => {
      console.log(`\n=========================================`);
      console.log(`  律师事务所案件管理系统 - 后端服务`);
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  环境: ${process.env.NODE_ENV}`);
      console.log(`=========================================\n`);
    });
  } catch (error) {
    console.error('启动服务失败:', error);
    process.exit(1);
  }
}

startServer();
