const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Notification, Case, Milestone } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, is_read, type } = req.query;
    const where = { user_id: req.userId };

    if (is_read !== undefined) where.is_read = is_read;
    if (type) where.type = type;

    const result = await Notification.findAndCountAll({
      where,
      include: [
        {
          model: Case, as: 'case_info', required: false,
          foreignKey: 'related_id',
          scope: { related_type: 'case' },
          attributes: ['id', 'case_number', 'case_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });

    paginatedResponse(res, result, page, pageSize);
  } catch (error) {
    next(error);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.userId, is_read: 0 }
    });

    const byType = await Notification.findAll({
      where: { user_id: req.userId, is_read: 0 },
      attributes: ['type', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      group: ['type']
    });

    successResponse(res, { total: count, by_type: byType });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) throw new AppError('通知不存在', 404);
    if (notification.user_id !== req.userId) {
      throw new AppError('无权查看此通知', 403);
    }
    successResponse(res, notification);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) throw new AppError('通知不存在', 404);
    if (notification.user_id !== req.userId) {
      throw new AppError('无权操作此通知', 403);
    }
    notification.is_read = 1;
    notification.read_at = new Date();
    await notification.save();
    successResponse(res, notification, '已标记为已读');
  } catch (error) {
    next(error);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: 1, read_at: new Date() },
      { where: { user_id: req.userId, is_read: 0 } }
    );
    successResponse(res, null, '全部标记为已读');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) throw new AppError('通知不存在', 404);
    if (notification.user_id !== req.userId) {
      throw new AppError('无权删除此通知', 403);
    }
    await notification.destroy();
    successResponse(res, null, '删除成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
