const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Case, User, CaseParty, Party, Document, Milestone } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');
const { generateCaseNumber, getToday, addDays } = require('../utils/helpers');

router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, pageSize = 10, keyword, case_type, status,
      court, lead_lawyer_id, start_date, end_date, my_cases
    } = req.query;

    const where = { is_deleted: 0 };

    if (keyword) {
      where[Op.or] = [
        { case_number: { [Op.like]: `%${keyword}%` } },
        { case_name: { [Op.like]: `%${keyword}%` } },
        { cause_of_action: { [Op.like]: `%${keyword}%` } },
        { opposing_party: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (case_type) where.case_type = case_type;
    if (status) where.status = status;
    if (court) where.court = { [Op.like]: `%${court}%` };
    if (lead_lawyer_id) where.lead_lawyer_id = lead_lawyer_id;
    if (my_cases === 'true') where.lead_lawyer_id = req.userId;
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = start_date;
      if (end_date) where.created_at[Op.lte] = `${end_date} 23:59:59`;
    }

    const result = await Case.findAndCountAll({
      where,
      include: [
        { model: User, as: 'lead_lawyer', attributes: ['id', 'real_name'] },
        { model: User, as: 'creator', attributes: ['id', 'real_name'] }
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

router.get('/stats/overview', async (req, res, next) => {
  try {
    const total = await Case.count({ where: { is_deleted: 0 } });
    const draft = await Case.count({ where: { status: 'draft', is_deleted: 0 } });
    const pending = await Case.count({ where: { status: 'pending', is_deleted: 0 } });
    const accepted = await Case.count({ where: { status: 'accepted', is_deleted: 0 } });
    const hearing = await Case.count({ where: { status: 'hearing', is_deleted: 0 } });
    const closed = await Case.count({ where: { status: 'closed', is_deleted: 0 } });

    const today = new Date();
    const sevenDaysLater = addDays(today, 7);
    
    const upcomingMilestones = await Milestone.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress'] },
        deadline_date: {
          [Op.between]: [getToday(), sevenDaysLater.toISOString().split('T')[0]]
        }
      },
      include: [{ model: Case, as: 'case_info', attributes: ['id', 'case_name', 'case_number'] }],
      order: [['deadline_date', 'ASC']],
      limit: 10
    });

    successResponse(res, {
      total,
      byStatus: { draft, pending, accepted, hearing, closed },
      upcomingMilestones
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const caseItem = await Case.findByPk(req.params.id, {
      include: [
        { model: User, as: 'lead_lawyer', attributes: ['id', 'real_name', 'phone', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'real_name'] },
        {
          model: CaseParty, as: 'case_parties',
          include: [{ model: Party, as: 'party_info' }]
        },
        {
          model: Document, as: 'documents',
          where: { is_deleted: 0 },
          required: false,
          include: [{ model: User, as: 'uploader', attributes: ['id', 'real_name'] }]
        },
        {
          model: Milestone, as: 'milestones',
          order: [['planned_date', 'ASC'], ['created_at', 'ASC']],
          include: [{ model: User, as: 'assignee', attributes: ['id', 'real_name'] }]
        }
      ],
      where: { is_deleted: 0 }
    });

    if (!caseItem) throw new AppError('案件不存在', 404);
    successResponse(res, caseItem);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const case_number = data.case_number || generateCaseNumber();

    const newCase = await Case.create({
      ...data,
      case_number,
      created_by: req.userId,
      updated_by: req.userId
    });

    if (data.auto_generate_milestones && data.filing_date) {
      try {
        const { generateMilestonesFromTemplate } = require('../services/milestoneService');
        await generateMilestonesFromTemplate(newCase.id, data.case_type, data.filing_date, req.userId);
      } catch (milestoneError) {
        console.warn('自动生成节点失败:', milestoneError.message);
      }
    }

    successResponse(res, newCase, '案件创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem || caseItem.is_deleted) throw new AppError('案件不存在', 404);

    await caseItem.update({
      ...req.body,
      updated_by: req.userId
    });

    successResponse(res, caseItem, '案件更新成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem || caseItem.is_deleted) throw new AppError('案件不存在', 404);

    caseItem.status = status;
    caseItem.updated_by = req.userId;
    
    if (status === 'closed' && !caseItem.closing_date) {
      caseItem.closing_date = getToday();
    }

    await caseItem.save();
    successResponse(res, { status }, '案件状态更新成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/save-draft', async (req, res, next) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem || caseItem.is_deleted) throw new AppError('案件不存在', 404);

    await caseItem.update({
      ...req.body,
      status: 'draft',
      updated_by: req.userId
    });
    successResponse(res, caseItem, '草稿保存成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/submit', async (req, res, next) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem || caseItem.is_deleted) throw new AppError('案件不存在', 404);

    await caseItem.update({
      ...req.body,
      status: 'pending',
      updated_by: req.userId
    });
    successResponse(res, caseItem, '案件提交成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const caseItem = await Case.findByPk(req.params.id);
    if (!caseItem || caseItem.is_deleted) throw new AppError('案件不存在', 404);

    caseItem.is_deleted = 1;
    caseItem.updated_by = req.userId;
    await caseItem.save();
    successResponse(res, null, '案件删除成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
