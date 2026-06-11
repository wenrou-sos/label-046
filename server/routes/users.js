const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');
const { requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, role, is_active } = req.query;
    const where = {};

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active;

    const result = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });

    paginatedResponse(res, result, page, pageSize);
  } catch (error) {
    next(error);
  }
});

router.get('/lawyers', async (req, res, next) => {
  try {
    const lawyers = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'lawyer'] }, is_active: 1 },
      attributes: ['id', 'real_name', 'username', 'role']
    });
    successResponse(res, lawyers);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) throw new AppError('用户不存在', 404);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { username, password, real_name, email, phone, role, is_active } = req.body;

    if (!username || !password || !real_name) {
      throw new AppError('用户名、密码和真实姓名不能为空', 400);
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) throw new AppError('用户名已存在', 400);

    const user = await User.create({
      username,
      password: await bcrypt.hash(password, 10),
      real_name,
      email,
      phone,
      role: role || 'lawyer',
      is_active: is_active ?? 1
    });

    const userInfo = user.toJSON();
    delete userInfo.password;
    successResponse(res, userInfo, '用户创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { real_name, email, phone, role, is_active, password } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('用户不存在', 404);

    if (password) user.password = await bcrypt.hash(password, 10);
    if (real_name !== undefined) user.real_name = real_name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;

    await user.save();
    const userInfo = user.toJSON();
    delete userInfo.password;
    successResponse(res, userInfo, '用户信息更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.userId) {
      throw new AppError('不能删除自己的账户', 400);
    }
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('用户不存在', 404);

    await user.destroy();
    successResponse(res, null, '用户删除成功');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle-status', requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) throw new AppError('用户不存在', 404);
    
    user.is_active = user.is_active ? 0 : 1;
    await user.save();
    successResponse(res, { is_active: user.is_active }, '状态更新成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
