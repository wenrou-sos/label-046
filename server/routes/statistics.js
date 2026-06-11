const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Case, Milestone, Document, Party, User, Notification } = require('../models');
const { successResponse } = require('../utils/response');
const { getToday, addDays } = require('../utils/helpers');

router.get('/dashboard', async (req, res, next) => {
  try {
    const today = getToday();
    const weekAgo = addDays(today, -7);
    const weekLater = addDays(today, 7);
    const monthAgo = addDays(today, -30);

    const totalCases = await Case.count({ where: { is_deleted: 0 } });
    const thisWeekNew = await Case.count({
      where: { is_deleted: 0, created_at: { [Op.gte]: weekAgo } }
    });

    const casesByStatus = await Case.findAll({
      where: { is_deleted: 0 },
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['status']
    });

    const casesByType = await Case.findAll({
      where: { is_deleted: 0 },
      attributes: ['case_type', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['case_type']
    });

    const upcomingMilestones = await Milestone.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress'] },
        deadline_date: { [Op.between]: [today, weekLater.toISOString().split('T')[0]] }
      },
      include: [{ model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name', 'status'] }],
      order: [['deadline_date', 'ASC']],
      limit: 10
    });

    const overdueMilestones = await Milestone.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress', 'delayed'] },
        deadline_date: { [Op.lt]: today }
      },
      include: [{ model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name', 'status'] }],
      order: [['deadline_date', 'DESC']],
      limit: 10
    });

    const recentDocuments = await Document.findAll({
      where: { is_deleted: 0, uploaded_at: { [Op.gte]: monthAgo } },
      include: [
        { model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name'] },
        { model: User, as: 'uploader', attributes: ['id', 'real_name'] }
      ],
      order: [['uploaded_at', 'DESC']],
      limit: 10
    });

    const recentNotifications = await Notification.findAll({
      where: { user_id: req.userId },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const totalParties = await Party.count({ where: { is_deleted: 0 } });
    const totalDocuments = await Document.count({ where: { is_deleted: 0 } });
    const activeUsers = await User.count({ where: { is_active: 1 } });
    const unreadCount = await Notification.count({
      where: { user_id: req.userId, is_read: 0 }
    });

    const monthlyCases = await Case.findAll({
      where: {
        is_deleted: 0,
        created_at: { [Op.gte]: addDays(today, -365) }
      },
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']],
      limit: 12
    });

    successResponse(res, {
      summary: {
        totalCases,
        thisWeekNew,
        totalParties,
        totalDocuments,
        activeUsers,
        unreadCount
      },
      casesByStatus,
      casesByType,
      upcomingMilestones,
      overdueMilestones,
      recentDocuments,
      recentNotifications,
      monthlyCases
    });
  } catch (error) {
    next(error);
  }
});

router.get('/cases-trend', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = addDays(getToday(), -parseInt(days));

    const trend = await Case.findAll({
      where: {
        is_deleted: 0,
        created_at: { [Op.gte]: startDate }
      },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
    });

    successResponse(res, trend);
  } catch (error) {
    next(error);
  }
});

router.get('/fee-stats', async (req, res, next) => {
  try {
    const feeData = await Case.findAll({
      where: { is_deleted: 0 },
      attributes: [
        'fee_status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('case_fee')), 'total']
      ],
      group: ['fee_status']
    });

    successResponse(res, feeData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
