const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'law_case_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      underscored: false
    },
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
}

module.exports = { sequelize, testConnection };
