const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Order',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      customer_name: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING(32), allowNull: false },
      placed_at: { type: DataTypes.DATE, allowNull: false },
      promised_at: { type: DataTypes.DATE, allowNull: true },
      is_vip: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'received' },
    },
    { tableName: 'orders', underscored: true },
  );
