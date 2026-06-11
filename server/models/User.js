const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  real_name: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.ENUM('admin', 'lawyer', 'assistant'), defaultValue: 'lawyer' },
  avatar: { type: DataTypes.STRING(255) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, onUpdate: DataTypes.NOW },
  is_active: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'users', timestamps: false });

User.prototype.checkPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

module.exports = User;
