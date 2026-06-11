const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { successResponse, AppError } = require('../utils/response');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }

    const user = await User.findOne({
      where: { username },
      attributes: ['id', 'username', 'password', 'real_name', 'email', 'phone', 'role', 'avatar', 'is_active']
    });

    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }

    if (!user.is_active) {
      throw new AppError('账户已被禁用，请联系管理员', 403);
    }

    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      throw new AppError('用户名或密码错误', 401);
    }

    const token = generateToken(user);
    const userInfo = user.toJSON();
    delete userInfo.password;

    successResponse(res, {
      token,
      user: userInfo
    }, '登录成功');
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, real_name, email, phone, role } = req.body;

    if (!username || !password || !real_name) {
      throw new AppError('用户名、密码和真实姓名不能为空', 400);
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError('用户名已存在', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      real_name,
      email,
      phone,
      role: role || 'lawyer',
      is_active: 1
    });

    const token = generateToken(user);
    const userInfo = user.toJSON();
    delete userInfo.password;

    successResponse(res, {
      token,
      user: userInfo
    }, '注册成功', 201);
  } catch (error) {
    next(error);
  }
});

router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'username', 'real_name', 'email', 'phone', 'role', 'avatar', 'created_at']
    });
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { real_name, email, phone, avatar, old_password, new_password } = req.body;
    const user = await User.findByPk(req.userId);

    if (old_password && new_password) {
      const isValid = await user.checkPassword(old_password);
      if (!isValid) {
        throw new AppError('原密码错误', 400);
      }
      user.password = await bcrypt.hash(new_password, 10);
    }

    user.real_name = real_name || user.real_name;
    user.email = email !== undefined ? email : user.email;
    user.phone = phone !== undefined ? phone : user.phone;
    user.avatar = avatar !== undefined ? avatar : user.avatar;

    await user.save();

    const userInfo = user.toJSON();
    delete userInfo.password;
    successResponse(res, userInfo, '个人信息更新成功');
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  successResponse(res, null, '退出登录成功');
});

module.exports = router;
