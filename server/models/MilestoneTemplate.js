const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MilestoneTemplate = sequelize.define('MilestoneTemplate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  case_type: {
    type: DataTypes.ENUM('civil', 'criminal', 'administrative', 'commercial', 'labor', 'family', 'other'),
    allowNull: true
  },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(500) },
  default_deadline_days: { type: DataTypes.INTEGER, defaultValue: 0 },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_system: { type: DataTypes.TINYINT, defaultValue: 1 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'milestone_templates', timestamps: false });

module.exports = MilestoneTemplate;
