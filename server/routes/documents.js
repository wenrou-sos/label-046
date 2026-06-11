const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Document, DocumentCategory, Case, User } = require('../models');
const { successResponse, paginatedResponse, AppError } = require('../utils/response');
const { getFileExtension, formatFileSize } = require('../utils/helpers');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { case_id } = req.body;
    const caseDir = path.join(uploadDir, `case_${case_id || 'temp'}`);
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
    cb(null, caseDir);
  },
  filename: (req, file, cb) => {
    const ext = getFileExtension(file.originalname);
    const filename = `${uuidv4()}.${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'txt', 'zip', 'rar', '7z'];
    const ext = getFileExtension(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('不支持的文件格式', 400));
    }
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, case_id, category_id, keyword, uploaded_by, start_date, end_date } = req.query;
    const where = { is_deleted: 0 };

    if (case_id) where.case_id = case_id;
    if (category_id) where.category_id = category_id;
    if (uploaded_by) where.uploaded_by = uploaded_by;
    if (keyword) {
      where[Op.or] = [
        { file_name: { [Op.like]: `%${keyword}%` } },
        { original_name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (start_date || end_date) {
      where.uploaded_at = {};
      if (start_date) where.uploaded_at[Op.gte] = start_date;
      if (end_date) where.uploaded_at[Op.lte] = `${end_date} 23:59:59`;
    }

    const result = await Document.findAndCountAll({
      where,
      include: [
        { model: DocumentCategory, as: 'category', attributes: ['id', 'name'] },
        { model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name'] },
        { model: User, as: 'uploader', attributes: ['id', 'real_name'] }
      ],
      order: [['uploaded_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (page - 1) * pageSize
    });

    result.rows = result.rows.map(doc => ({
      ...doc.toJSON(),
      file_size_formatted: formatFileSize(doc.file_size)
    }));

    paginatedResponse(res, result, page, pageSize);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id, {
      include: [
        { model: DocumentCategory, as: 'category' },
        { model: Case, as: 'case_info', attributes: ['id', 'case_number', 'case_name'] },
        { model: User, as: 'uploader', attributes: ['id', 'real_name'] }
      ]
    });
    if (!doc || doc.is_deleted) throw new AppError('文件不存在', 404);

    const docJson = doc.toJSON();
    docJson.file_size_formatted = formatFileSize(doc.file_size);
    successResponse(res, docJson);
  } catch (error) {
    next(error);
  }
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('请选择要上传的文件', 400);

    const { case_id, category_id, file_name, description } = req.body;
    if (!case_id) throw new AppError('请选择案件', 400);

    const ext = getFileExtension(req.file.originalname);
    const relativePath = path.relative(path.join(__dirname, '..', '..'), req.file.path).replace(/\\/g, '/');

    const document = await Document.create({
      case_id,
      category_id: category_id || null,
      file_name: file_name || req.file.originalname,
      original_name: req.file.originalname,
      file_path: `/uploads/${relativePath}`,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      file_ext: ext,
      description,
      uploaded_by: req.userId
    });

    successResponse(res, {
      ...document.toJSON(),
      file_size_formatted: formatFileSize(document.file_size)
    }, '文件上传成功', 201);
  } catch (error) {
    next(error);
  }
});

router.post('/upload-multiple', upload.array('files', 20), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new AppError('请选择要上传的文件', 400);
    }

    const { case_id, category_id, descriptions = {} } = req.body;
    if (!case_id) throw new AppError('请选择案件', 400);

    const documents = [];
    for (const file of req.files) {
      const ext = getFileExtension(file.originalname);
      const relativePath = path.relative(path.join(__dirname, '..', '..'), file.path).replace(/\\/g, '/');
      
      const doc = await Document.create({
        case_id,
        category_id: category_id || null,
        file_name: file.originalname,
        original_name: file.originalname,
        file_path: `/uploads/${relativePath}`,
        file_size: file.size,
        file_type: file.mimetype,
        file_ext: ext,
        description: descriptions[file.originalname] || '',
        uploaded_by: req.userId
      });
      documents.push({
        ...doc.toJSON(),
        file_size_formatted: formatFileSize(doc.file_size)
      });
    }

    successResponse(res, documents, `成功上传${documents.length}个文件`, 201);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) throw new AppError('文件不存在', 404);
    await doc.update(req.body);
    successResponse(res, doc, '文件信息更新成功');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) throw new AppError('文件不存在', 404);

    doc.is_deleted = 1;
    await doc.save();

    successResponse(res, null, '文件删除成功');
  } catch (error) {
    next(error);
  }
});

router.get('/:id/download', async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) throw new AppError('文件不存在', 404);

    const filePath = path.join(__dirname, '..', '..', doc.file_path.replace('/uploads', 'uploads'));
    if (!fs.existsSync(filePath)) {
      throw new AppError('文件在服务器上不存在', 404);
    }

    res.download(filePath, encodeURIComponent(doc.original_name), (err) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview', async (req, res, next) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc || doc.is_deleted) throw new AppError('文件不存在', 404);

    successResponse(res, {
      url: doc.file_path,
      file_name: doc.file_name,
      file_type: doc.file_type,
      file_ext: doc.file_ext,
      file_size: doc.file_size,
      can_preview_inline: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt'].includes(doc.file_ext.toLowerCase())
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
