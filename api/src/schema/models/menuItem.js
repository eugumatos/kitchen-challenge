const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'MenuItem',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING(32), allowNull: false },
      prep_time_minutes: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'menu_items', underscored: true },
  );
