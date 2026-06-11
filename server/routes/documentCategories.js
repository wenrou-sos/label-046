const express = require('express');
const router = express.Router();
const { DocumentCategory } = require('../models');
const { successResponse, AppError } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const categories = await DocumentCategory.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });
    successResponse(res, categories);
  } catch (error) {
    next(error);
  }
});

router.get('/tree', async (req, res, next) => {
  try {
    const categories = await DocumentCategory.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });

    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item.toJSON(),
          children: buildTree(items, item.id)
        }));
    };

    successResponse(res, buildTree(categories));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const category = await DocumentCategory.create({
      ...req.body,
      created_by: req.userId
    });
    successResponse(res, category, '分类创建成功', 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const category = await DocumentCategory.findByPk(req.params.id);
    if (!category) throw new AppError('分类不存在', 404);
    await category.update(req.body);
    successResponse(res, category, '分类更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await DocumentCategory.findByPk(req.params.id);
    if (!category) throw new AppError('分类不存在', 404);

    const { Document } = require('../models');
    const docCount = await Document.count({ where: { category_id: req.params.id, is_deleted: 0 } });
    if (docCount > 0) {
      throw new AppError(`该分类下有${docCount}个文件，无法删除`, 400);
    }

    const childCount = await DocumentCategory.count({ where: { parent_id: req.params.id } });
    if (childCount > 0) {
      throw new AppError(`该分类下有${childCount}个子分类，无法删除`, 400);
    }

    await category.destroy();
    successResponse(res, null, '分类删除成功');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
