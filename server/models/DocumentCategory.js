const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentCategory = sequelize.define('DocumentCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  parent_id: { type: DataTypes.INTEGER, defaultValue: null },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  description: { type: DataTypes.STRING(500) },
  created_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'document_categories', timestamps: false });

module.exports = DocumentCategory;
