const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { ReminderRule } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');
const { requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, is_enabled, keyword } = req.query;
    const where = {};
    if (is_enabled !== undefined) where.is_enabled = is_enabled;
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };

    const result = await ReminderRule.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });
    paginatedResponse(res, result, page, pageSize);
  } catch (error) {
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const rules = await ReminderRule.findAll({
      where: { is_enabled: 1 },
      order: [['priority', 'DESC'], ['warning_days', 'DESC']]
    });
    successResponse(res, rules);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const rule = await ReminderRule.findByPk(req.params.id);
    if (!rule) throw new AppError('规则不存在', 404);
    successResponse(res, rule);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const rule = await ReminderRule.create({
      ...req.body,
      created_by: req.userId
    });
    successResponse(res, rule, '规则创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const rule = await ReminderRule.findByPk(req.params.id);
    if (!rule) throw new AppError('规则不存在', 404);
    await rule.update(req.body);
    successResponse(res, rule, '规则更新成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', requireRole('admin'), async (req, res, next) => {
  try {
    const rule = await ReminderRule.findByPk(req.params.id);
    if (!rule) throw new AppError('规则不存在', 404);
    rule.is_enabled = rule.is_enabled ? 0 : 1;
    await rule.save();
    successResponse(res, { is_enabled: rule.is_enabled }, '状态更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const rule = await ReminderRule.findByPk(req.params.id);
    if (!rule) throw new AppError('规则不存在', 404);
    await rule.destroy();
    successResponse(res, null, '规则删除成功');
  } catch (error) {
    next(error);
  }
});

router.post('/run-check', requireRole('admin'), async (req, res, next) => {
  try {
    const { checkDeadlinesAndNotify } = require('../services/reminderService');
    await checkDeadlinesAndNotify();
    successResponse(res, null, '手动触发提醒检查完成');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
