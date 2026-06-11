const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CaseParty = sequelize.define('CaseParty', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  case_id: { type: DataTypes.INTEGER, allowNull: false },
  party_id: { type: DataTypes.INTEGER, allowNull: false },
  role: {
    type: DataTypes.ENUM('plaintiff', 'defendant', 'third_party', 'appellant', 'appellee', 'witness'),
    defaultValue: 'plaintiff'
  },
  is_our_client: { type: DataTypes.TINYINT, defaultValue: 1 },
  attorney_name: { type: DataTypes.STRING(50) },
  attorney_phone: { type: DataTypes.STRING(20) },
  joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'case_parties', timestamps: false });

module.exports = CaseParty;
