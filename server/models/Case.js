const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Case = sequelize.define('Case', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  case_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  case_name: { type: DataTypes.STRING(200), allowNull: false },
  case_type: {
    type: DataTypes.ENUM('civil', 'criminal', 'administrative', 'commercial', 'labor', 'family', 'other'),
    defaultValue: 'civil'
  },
  cause_of_action: { type: DataTypes.STRING(200) },
  court: { type: DataTypes.STRING(200) },
  judge: { type: DataTypes.STRING(50) },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'accepted', 'hearing', 'judgment', 'appeal', 'closed', 'suspended'),
    defaultValue: 'draft'
  },
  description: { type: DataTypes.TEXT },
  filing_date: { type: DataTypes.DATEONLY },
  closing_date: { type: DataTypes.DATEONLY },
  lead_lawyer_id: { type: DataTypes.INTEGER },
  assistant_lawyer_ids: { type: DataTypes.JSON },
  client_demand: { type: DataTypes.TEXT },
  opposing_party: { type: DataTypes.STRING(200) },
  case_fee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  fee_status: { type: DataTypes.ENUM('unpaid', 'partial', 'paid'), defaultValue: 'unpaid' },
  created_by: { type: DataTypes.INTEGER },
  updated_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  is_deleted: { type: DataTypes.TINYINT, defaultValue: 0 }
}, { tableName: 'cases', timestamps: false });

module.exports = Case;
