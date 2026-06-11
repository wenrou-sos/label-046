const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Party = sequelize.define('Party', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  type: { type: DataTypes.ENUM('individual', 'company', 'organization'), defaultValue: 'individual' },
  gender: { type: DataTypes.ENUM('male', 'female', 'unknown'), defaultValue: 'unknown' },
  id_card: { type: DataTypes.STRING(20), unique: true },
  company_name: { type: DataTypes.STRING(200) },
  unified_social_credit: { type: DataTypes.STRING(50), unique: true },
  legal_representative: { type: DataTypes.STRING(50) },
  phone: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.STRING(500) },
  occupation: { type: DataTypes.STRING(100) },
  nationality: { type: DataTypes.STRING(50) },
  remark: { type: DataTypes.TEXT },
  created_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  is_deleted: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'parties', timestamps: false });

module.exports = Party;
