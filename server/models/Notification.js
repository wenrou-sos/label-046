const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('deadline_warning', 'deadline_overdue', 'system', 'milestone', 'case_update'),
    defaultValue: 'system'
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  related_type: { type: DataTypes.ENUM('case', 'milestone', 'document', 'party') },
  related_id: { type: DataTypes.INTEGER },
  is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
  read_at: { type: DataTypes.DATE },
  send_method: { type: DataTypes.ENUM('system', 'email', 'sms'), defaultValue: 'system' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'notifications', timestamps: false });

module.exports = Notification;
