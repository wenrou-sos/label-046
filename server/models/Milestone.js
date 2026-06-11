const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Milestone = sequelize.define('Milestone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  case_id: { type: DataTypes.INTEGER, allowNull: false },
  template_id: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(500) },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'delayed', 'cancelled'),
    defaultValue: 'pending'
  },
  planned_date: { type: DataTypes.DATEONLY },
  actual_date: { type: DataTypes.DATEONLY },
  deadline_date: { type: DataTypes.DATEONLY },
  reminder_date: { type: DataTypes.DATEONLY },
  assignee_id: { type: DataTypes.INTEGER },
  is_auto_generated: { type: DataTypes.TINYINT, defaultValue: 0 },
  created_by: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  completed_note: { type: DataTypes.TEXT }
}, { tableName: 'milestones', timestamps: false });

module.exports = Milestone;
