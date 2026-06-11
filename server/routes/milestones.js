const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Milestone, MilestoneTemplate, Case, User } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');
const { getToday } = require('../utils/helpers');

router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, pageSize = 10, case_id, status, assignee_id,
      start_date, end_date, upcoming, overdue
    } = req.query;

    const where = {};
    if (case_id) where.case_id = case_id;
    if (status) where.status = status;
    if (assignee_id) where.assignee_id = assignee_id;

    if (upcoming === 'true') {
      const today = getToday();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      where.deadline_date = {
        [Op.between]: [today, weekLater.toISOString().split('T')[0]]
      };
      where.status = { [Op.in]: ['pending', 'in_progress'] };
    }

    if (overdue === 'true') {
      where.deadline_date = { [Op.lt]: getToday() };
      where.status = { [Op.in]: ['pending', 'in_progress', 'delayed'] };
    }

    if (start_date || end_date) {
      where.created_at = where.created_at || {};
      if (start_date) where.created_at[Op.gte] = start_date;
      if (end_date) where.created_at[Op.lte] = `${end_date} 23:59:59`;
    }

    const result = await Milestone.findAndCountAll({
      where,
      include: [
        { model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name'] },
        { model: User, as: 'assignee', attributes: ['id', 'real_name'] }
      ],
      order: [
        ['deadline_date', 'ASC'],
        ['created_at', 'ASC']
      ],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });

    paginatedResponse(res, result, page, pageSize);
  } catch (error) {
    next(error);
  }
});

router.get('/timeline/:caseId', async (req, res, next) => {
  try {
    const milestones = await Milestone.findAll({
      where: { case_id: req.params.caseId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'real_name'] }
      ],
      order: [
        ['planned_date', 'ASC'],
        ['created_at', 'ASC']
      ]
    });
    successResponse(res, milestones);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id, {
      include: [
        { model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name'] },
        { model: MilestoneTemplate, as: 'template' },
        { model: User, as: 'assignee', attributes: ['id', 'real_name'] }
      ]
    });
    if (!milestone) throw new AppError('节点不存在', 404);
    successResponse(res, milestone);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const milestone = await Milestone.create({
      ...req.body,
      created_by: req.userId,
      is_auto_generated: 0
    });
    successResponse(res, milestone, '节点创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.post('/generate-from-template/:caseId', async (req, res, next) => {
  try {
    const { case_type, filing_date } = req.body;
    const { generateMilestonesFromTemplate } = require('../services/milestoneService');
    const milestones = await generateMilestonesFromTemplate(
      req.params.caseId,
      case_type,
      filing_date || getToday(),
      req.userId
    );
    successResponse(res, milestones, `成功生成${milestones.length}个节点`, 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);
    if (!milestone) throw new AppError('节点不存在', 404);
    await milestone.update(req.body);
    successResponse(res, milestone, '节点更新成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, completed_note } = req.body;
    const milestone = await Milestone.findByPk(req.params.id);
    if (!milestone) throw new AppError('节点不存在', 404);

    milestone.status = status;
    if (completed_note !== undefined) milestone.completed_note = completed_note;
    if (status === 'completed' && !milestone.actual_date) {
      milestone.actual_date = getToday();
    }

    await milestone.save();
    successResponse(res, milestone, '节点状态更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const milestone = await Milestone.findByPk(req.params.id);
    if (!milestone) throw new AppError('节点不存在', 404);

    if (milestone.is_auto_generated) {
      throw new AppError('系统自动生成的节点无法删除', 400);
    }

    await milestone.destroy();
    successResponse(res, null, '节点删除成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
