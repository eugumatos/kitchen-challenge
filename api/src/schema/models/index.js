const { Sequelize } = require('sequelize');
const allConfigs = require('../config/config');

const env = process.env.NODE_ENV === 'test' ? 'test' : 'development';
const config = allConfigs[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const MenuItem = require('./menuItem')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(MenuItem, { as: 'menuItem', foreignKey: 'menu_item_id' });
MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id' });

module.exports = { sequelize, Sequelize, MenuItem, Order, OrderItem };
