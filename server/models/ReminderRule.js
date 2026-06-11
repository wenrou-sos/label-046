const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReminderRule = sequelize.define('ReminderRule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  milestone_name: { type: DataTypes.STRING(100) },
  warning_days: { type: DataTypes.INTEGER, defaultValue: 3 },
  repeat_warning: { type: DataTypes.TINYINT, defaultValue: 0 },
  repeat_interval_hours: { type: DataTypes.INTEGER, defaultValue: 24 },
  notify_methods: { type: DataTypes.JSON, defaultValue: '["system"]' },
  notify_roles: { type: DataTypes.JSON, defaultValue: '["lawyer"]' },
  extra_user_ids: { type: DataTypes.JSON },
  is_enabled: { type: DataTypes.TINYINT, defaultValue: 1 },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  created_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW }
}, { tableName: 'reminder_rules', timestamps: false });

module.exports = ReminderRule;
