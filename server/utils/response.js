class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    code: statusCode,
    message,
    data
  });
};

const paginatedResponse = (res, { rows = [], count = 0 }, page = 1, pageSize = 10, message = '获取成功') => {
  const totalPages = Math.ceil(count / pageSize) || 0;
  return res.status(200).json({
    code: 200,
    message,
    data: {
      list: rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count,
        totalPages
      }
    }
  });
};

module.exports = { AppError, successResponse, paginatedResponse };
