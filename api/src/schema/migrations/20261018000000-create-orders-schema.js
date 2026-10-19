'use strict';

// Allowed values are VARCHAR + CHECK (not PG ENUM) so a later migration can swap them by
// dropping and re-adding the named constraint inside one transaction.
// The lists are copied here on purpose: a migration is a snapshot of the schema at this point
// in time and must not change when the domain constants change.
const CATEGORIES = ['starter', 'main_course', 'dessert', 'drink'];
const ORDER_TYPES = ['dine_in', 'takeout', 'delivery'];
const ORDER_STATUSES = ['received', 'preparing', 'ready', 'picked_up', 'cancelled'];

const inList = (values) => values.map((v) => `'${v}'`).join(', ');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const timestamps = {
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      };

      await queryInterface.createTable(
        'menu_items',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          name: { type: Sequelize.STRING, allowNull: false, unique: true },
          category: { type: Sequelize.STRING(32), allowNull: false },
          prep_time_minutes: { type: Sequelize.INTEGER, allowNull: false },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'orders',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          customer_name: { type: Sequelize.STRING, allowNull: false },
          type: { type: Sequelize.STRING(32), allowNull: false },
          placed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
          promised_at: { type: Sequelize.DATE, allowNull: true },
          is_vip: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'received' },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'order_items',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          menu_item_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'menu_items', key: 'id' },
            onDelete: 'RESTRICT',
          },
          quantity: { type: Sequelize.INTEGER, allowNull: false },
          ...timestamps,
        },
        { transaction },
      );

      const constraints = [
        `ALTER TABLE menu_items ADD CONSTRAINT menu_items_name_not_blank CHECK (btrim(name) <> '')`,
        `ALTER TABLE menu_items ADD CONSTRAINT menu_items_category_check CHECK (category IN (${inList(CATEGORIES)}))`,
        `ALTER TABLE menu_items ADD CONSTRAINT menu_items_prep_time_positive CHECK (prep_time_minutes > 0)`,
        `ALTER TABLE orders ADD CONSTRAINT orders_customer_name_not_blank CHECK (btrim(customer_name) <> '')`,
        `ALTER TABLE orders ADD CONSTRAINT orders_type_check CHECK (type IN (${inList(ORDER_TYPES)}))`,
        `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (${inList(ORDER_STATUSES)}))`,
        `ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)`,
      ];
      for (const sql of constraints) {
        await queryInterface.sequelize.query(sql, { transaction });
      }

      await queryInterface.addIndex('orders', ['status'], {
        name: 'orders_status_idx',
        transaction,
      });
      await queryInterface.addIndex('order_items', ['order_id'], {
        name: 'order_items_order_id_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('order_items', { transaction });
      await queryInterface.dropTable('orders', { transaction });
      await queryInterface.dropTable('menu_items', { transaction });
    });
  },
};
