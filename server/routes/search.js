const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Case, Party, User } = require('../models');
const { successResponse } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { keyword, limit = 20 } = req.query;

    if (!keyword || keyword.trim() === '') {
      return successResponse(res, {
        cases: [],
        parties: [],
        users: []
      });
    }

    const searchKeyword = `%${keyword}%`;
    const limitNum = parseInt(limit) || 20;

    const [cases, parties, users] = await Promise.all([
      Case.findAll({
        where: {
          is_deleted: 0,
          [Op.or]: [
            { case_number: { [Op.like]: searchKeyword } },
            { case_name: { [Op.like]: searchKeyword } },
            { cause_of_action: { [Op.like]: searchKeyword } }
          ]
        },
        attributes: ['id', 'case_number', 'case_name', 'case_type', 'status', 'cause_of_action'],
        limit: limitNum,
        order: [['created_at', 'DESC']]
      }),
      Party.findAll({
        where: {
          is_deleted: 0,
          [Op.or]: [
            { name: { [Op.like]: searchKeyword } },
            { id_card: { [Op.like]: searchKeyword } },
            { company_name: { [Op.like]: searchKeyword } }
          ]
        },
        attributes: ['id', 'name', 'type', 'phone', 'company_name'],
        limit: limitNum,
        order: [['created_at', 'DESC']]
      }),
      User.findAll({
        where: {
          is_active: 1,
          [Op.or]: [
            { real_name: { [Op.like]: searchKeyword } },
            { username: { [Op.like]: searchKeyword } }
          ]
        },
        attributes: ['id', 'real_name', 'username', 'role'],
        limit: limitNum,
        order: [['created_at', 'DESC']]
      })
    ]);

    const formattedCases = cases.map(c => ({
      type: 'case',
      id: c.id,
      title: c.case_name,
      subtitle: c.case_number,
      description: c.cause_of_action || '',
      extra: {
        case_type: c.case_type,
        status: c.status
      },
      url: `/cases/${c.id}`
    }));

    const formattedParties = parties.map(p => ({
      type: 'party',
      id: p.id,
      title: p.name,
      subtitle: p.type === 'individual' ? '自然人' : p.type === 'company' ? '企业法人' : '其他组织',
      description: p.phone || p.company_name || '',
      extra: {
        type: p.type,
        company_name: p.company_name
      },
      url: `/parties/${p.id}`
    }));

    const formattedUsers = users.map(u => ({
      type: 'user',
      id: u.id,
      title: u.real_name,
      subtitle: u.role === 'admin' ? '管理员' : u.role === 'lawyer' ? '律师' : '助理',
      description: '',
      extra: {
        role: u.role,
        username: u.username
      },
      url: u.role === 'admin' || u.role === 'lawyer' ? `/cases?lead_lawyer_id=${u.id}` : '#'
    }));

    successResponse(res, {
      total: formattedCases.length + formattedParties.length + formattedUsers.length,
      cases: formattedCases,
      parties: formattedParties,
      users: formattedUsers,
      all: [
        ...formattedCases,
        ...formattedParties,
        ...formattedUsers
      ]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
