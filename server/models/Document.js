const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  case_id: { type: DataTypes.INTEGER, allowNull: false },
  category_id: { type: DataTypes.INTEGER },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  original_name: { type: DataTypes.STRING(255), allowNull: false },
  file_path: { type: DataTypes.STRING(500), allowNull: false },
  file_size: { type: DataTypes.BIGINT },
  file_type: { type: DataTypes.STRING(100) },
  file_ext: { type: DataTypes.STRING(20) },
  description: { type: DataTypes.STRING(500) },
  page_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: false },
  uploaded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  is_deleted: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'documents', timestamps: false });

module.exports = Document;
