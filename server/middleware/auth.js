const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') 
                  || req.headers['x-access-token']
                  || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌，请先登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'real_name', 'email', 'phone', 'role', 'avatar', 'is_active']
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被删除'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        code: 403,
        message: '账户已被禁用，请联系管理员'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    return res.status(401).json({
      code: 401,
      message: '认证失败，请重新登录',
      error: error.message
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，无法执行此操作'
      });
    }
    next();
  };
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
