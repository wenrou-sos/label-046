#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'server');
const CLIENT_DIR = path.join(ROOT, 'client');

console.log('\n=========================================');
console.log('  律师事务所案件管理系统 - 初始化安装');
console.log('=========================================\n');

const steps = [
  {
    name: '检查环境',
    fn: () => {
      try {
        const nodeVer = execSync('node --version').toString().trim();
        const npmVer = execSync('npm --version').toString().trim();
        console.log(`  ✓ Node.js: ${nodeVer}`);
        console.log(`  ✓ npm: ${npmVer}`);
        return true;
      } catch (e) {
        console.error('  ✗ 请先安装 Node.js (>=16.0.0)');
        return false;
      }
    }
  },
  {
    name: '创建必要目录',
    fn: () => {
      const dirs = [
        path.join(ROOT, 'uploads'),
        path.join(ROOT, 'client', 'node_modules'),
        path.join(ROOT, 'server', 'node_modules')
      ];
      dirs.forEach(d => {
        if (!fs.existsSync(d)) {
          fs.mkdirSync(d, { recursive: true });
        }
      });
      console.log('  ✓ 目录创建完成');
      return true;
    }
  },
  {
    name: '安装后端依赖 (server)',
    fn: () => {
      console.log('  正在安装后端依赖，这可能需要几分钟...');
      try {
        process.chdir(SERVER_DIR);
        execSync('npm install', { stdio: 'inherit' });
        process.chdir(ROOT);
        console.log('  ✓ 后端依赖安装完成');
        return true;
      } catch (e) {
        console.error('  ✗ 后端依赖安装失败:', e.message);
        return false;
      }
    }
  },
  {
    name: '安装前端依赖 (client)',
    fn: () => {
      console.log('  正在安装前端依赖，这可能需要几分钟...');
      try {
        process.chdir(CLIENT_DIR);
        execSync('npm install', { stdio: 'inherit' });
        process.chdir(ROOT);
        console.log('  ✓ 前端依赖安装完成');
        return true;
      } catch (e) {
        console.error('  ✗ 前端依赖安装失败:', e.message);
        return false;
      }
    }
  },
  {
    name: '提示数据库配置',
    fn: () => {
      console.log('\n  ⚠️  请确保 MySQL 服务已启动');
      console.log('  ⚠️  请执行数据库脚本: mysql -u root -p < database/schema.sql');
      console.log('  ⚠️  请修改 server/.env 中的数据库连接信息\n');

      const envPath = path.join(SERVER_DIR, '.env');
      console.log(`  📍 环境变量文件: ${envPath}`);
      console.log('     请修改以下参数：');
      console.log('       DB_HOST=localhost');
      console.log('       DB_PORT=3306');
      console.log('       DB_USER=root');
      console.log('       DB_PASSWORD=你的MySQL密码');
      console.log('       DB_NAME=law_case_management');

      console.log('\n  📍 预置登录账号:');
      console.log('       管理员: admin / admin123');
      console.log('       律师: lawyer01 / admin123');
      console.log('       律师: lawyer02 / admin123');

      return true;
    }
  },
  {
    name: '启动说明',
    fn: () => {
      console.log('\n=========================================');
      console.log('  安装完成！启动方式：');
      console.log('=========================================');
      console.log('\n  方式一：一键启动 (推荐)');
      console.log('    npm run dev');
      console.log('\n  方式二：分别启动');
      console.log('    # 终端1 - 后端服务 (端口:3001)');
      console.log('    cd server && npm run dev');
      console.log('\n    # 终端2 - 前端服务 (端口:3000)');
      console.log('    cd client && npm start');
      console.log('\n  访问地址: http://localhost:3000');
      console.log('\n=========================================\n');
      return true;
    }
  }
];

(async () => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(`\n[${i + 1}/${steps.length}] ${step.name}`);
    console.log('-'.repeat(40));
    const ok = step.fn();
    if (!ok) {
      console.error('\n安装中断，请检查错误信息后重试。');
      process.exit(1);
    }
  }
})();
