const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { MilestoneTemplate } = require('../models');
const { successResponse, AppError } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { case_type } = req.query;
    const where = {};
    if (case_type) {
      where[Op.or] = [
        { case_type },
        { case_type: { [Op.is]: null } }
      ];
    }
    const templates = await MilestoneTemplate.findAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });
    successResponse(res, templates);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const template = await MilestoneTemplate.findByPk(req.params.id);
    if (!template) throw new AppError('模板不存在', 404);
    successResponse(res, template);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const template = await MilestoneTemplate.create({
      ...req.body,
      is_system: 0
    });
    successResponse(res, template, '模板创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const template = await MilestoneTemplate.findByPk(req.params.id);
    if (!template) throw new AppError('模板不存在', 404);
    await template.update(req.body);
    successResponse(res, template, '模板更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const template = await MilestoneTemplate.findByPk(req.params.id);
    if (!template) throw new AppError('模板不存在', 404);
    if (template.is_system) {
      throw new AppError('系统内置模板无法删除', 400);
    }
    await template.destroy();
    successResponse(res, null, '模板删除成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
