const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Party, CaseParty, Case } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, type, case_id } = req.query;
    const where = { is_deleted: 0 };

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { id_card: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { company_name: { [Op.like]: `%${keyword}%` } },
        { unified_social_credit: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (type) where.type = type;

    if (case_id) {
      const caseParties = await CaseParty.findAll({ where: { case_id } });
      const partyIds = caseParties.map(cp => cp.party_id);
      where.id = { [Op.in]: partyIds.length ? partyIds : [null] };
    }

    const result = await Party.findAndCountAll({
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
    const parties = await Party.findAll({
      where: { is_deleted: 0 },
      attributes: ['id', 'name', 'type', 'phone', 'id_card', 'company_name'],
      order: [['name', 'ASC']]
    });
    successResponse(res, parties);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const party = await Party.findByPk(req.params.id, {
      include: [{
        model: CaseParty, as: 'case_associations',
        include: [{ model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name', 'status'] }]
      }]
    });
    if (!party || party.is_deleted) throw new AppError('当事人不存在', 404);
    successResponse(res, party);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const party = await Party.create({
      ...req.body,
      created_by: req.userId
    });
    successResponse(res, party, '当事人创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { parties = [] } = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      throw new AppError('当事人数据不能为空', 400);
    }

    const createdParties = await Promise.all(
      parties.map(p => Party.create({ ...p, created_by: req.userId }))
    );

    successResponse(res, createdParties, `批量创建了${createdParties.length}个当事人`, 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const party = await Party.findByPk(req.params.id);
    if (!party || party.is_deleted) throw new AppError('当事人不存在', 404);
    await party.update(req.body);
    successResponse(res, party, '当事人信息更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const party = await Party.findByPk(req.params.id);
    if (!party || party.is_deleted) throw new AppError('当事人不存在', 404);

    const caseCount = await CaseParty.count({ where: { party_id: req.params.id } });
    if (caseCount > 0) {
      throw new AppError(`该当事人关联了${caseCount}个案件，无法删除`, 400);
    }

    party.is_deleted = 1;
    await party.save();
    successResponse(res, null, '当事人删除成功');
  } catch (error) {
    next(error);
  }
});

router.get('/case/:caseId', async (req, res, next) => {
  try {
    const caseParties = await CaseParty.findAll({
      where: { case_id: req.params.caseId },
      include: [{ model: Party, as: 'party_info' }],
      order: [['joined_at', 'ASC']]
    });
    successResponse(res, caseParties);
  } catch (error) {
    next(error);
  }
});

router.post('/case/:caseId/link', async (req, res, next) => {
  try {
    const { party_id, role = 'plaintiff', is_our_client = 1, attorney_name, attorney_phone } = req.body;

    if (!party_id) throw new AppError('请选择当事人', 400);

    const [caseParty, created] = await CaseParty.findOrCreate({
      where: {
        case_id: req.params.caseId,
        party_id,
        role
      },
      defaults: {
        is_our_client,
        attorney_name,
        attorney_phone
      }
    });

    if (!created) {
      await caseParty.update({ is_our_client, attorney_name, attorney_phone });
    }

    successResponse(res, caseParty, created ? '关联成功' : '关联更新成功');
  } catch (error) {
    next(error);
  }
});

router.post('/case/:caseId/batch-link', async (req, res, next) => {
  try {
    const { parties = [] } = req.body;
    if (!Array.isArray(parties) || parties.length === 0) {
      throw new AppError('请选择要关联的当事人', 400);
    }

    const results = [];
    for (const p of parties) {
      const [cp] = await CaseParty.findOrCreate({
        where: {
          case_id: req.params.caseId,
          party_id: p.party_id,
          role: p.role || 'plaintiff'
        },
        defaults: {
          is_our_client: p.is_our_client ?? 1,
          attorney_name: p.attorney_name,
          attorney_phone: p.attorney_phone
        }
      });
      results.push(cp);
    }

    successResponse(res, results, `成功关联${results.length}个当事人`);
  } catch (error) {
    next(error);
  }
});

router.delete('/case/:caseId/unlink/:partyId', async (req, res, next) => {
  try {
    const { role } = req.query;
    const where = {
      case_id: req.params.caseId,
      party_id: req.params.partyId
    };
    if (role) where.role = role;

    const deleted = await CaseParty.destroy({ where });
    if (deleted === 0) throw new AppError('关联关系不存在', 404);

    successResponse(res, null, '解除关联成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
