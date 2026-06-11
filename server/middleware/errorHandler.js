const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] 错误详情:`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let errorDetail = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = '数据验证失败';
    errorDetail = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = '数据重复，违反唯一约束';
    errorDetail = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} 已存在`
    }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '外键约束错误，关联数据不存在';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的认证令牌';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = '文件大小超出限制';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = '请求体过大';
  }

  res.status(statusCode).json({
    code: statusCode,
    message,
    errors: errorDetail,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
