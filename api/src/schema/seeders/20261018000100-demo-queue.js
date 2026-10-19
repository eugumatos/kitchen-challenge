'use strict';

// Every timestamp is relative to the moment the seed runs, so the demo never goes stale.
// Expected scores at seed time (type + vip + wait + promise + complexity):
//   Fabio  80 = 30 + 20 + 15 +  0 + 15   dine_in VIP, preparing
//   Ana    70 = 30 +  0 + 40 +  0 +  0   wait-time cap (130 min)
//   Carla  60 = 10 + 20 +  5 + 25 +  0   delivery VIP, preparing
//   Diego  55 = 20 +  0 + 10 + 25 +  0   tie with Elisa, same placed_at, promised earlier -> first
//   Elisa  55 = 20 +  0 + 10 + 25 +  0
//   Bruno  40 = 20 +  0 +  0 +  0 + 20   complexity cap (70 prep min)
//   Gabi   30 = 10 +  0 +  0 + 15 +  5
//   Heitor (ready), Iara (picked_up), Joao (cancelled) stay out of the active queue.
// Diego and Elisa share placed_at and are both overdue, so they keep 25 promise points and an
// identical score as time passes; the tie is always resolved by promised_at.

const MENU = [
  { name: 'Grilled Salmon', category: 'main_course', prep_time_minutes: 20 },
  { name: 'Caesar Salad', category: 'starter', prep_time_minutes: 10 },
  { name: 'Margherita Pizza', category: 'main_course', prep_time_minutes: 12 },
  { name: 'Beef Lasagna', category: 'main_course', prep_time_minutes: 35 },
  { name: 'Ribeye Steak', category: 'main_course', prep_time_minutes: 25 },
  { name: 'Chicken Wings', category: 'starter', prep_time_minutes: 15 },
  { name: 'Tiramisu', category: 'dessert', prep_time_minutes: 8 },
  { name: 'Lemonade', category: 'drink', prep_time_minutes: 2 },
];

module.exports = {
  async up(queryInterface) {
    const now = Date.now();
    const minutesFromNow = (m) => new Date(now + m * 60 * 1000);
    const tiedPlacedAt = minutesFromNow(-25);

    const orders = [
      { customer_name: 'Fabio', type: 'dine_in', is_vip: true, status: 'preparing',
        placed_at: minutesFromNow(-32), promised_at: null,
        items: [['Grilled Salmon', 2], ['Caesar Salad', 1]] },
      { customer_name: 'Ana', type: 'dine_in', is_vip: false, status: 'received',
        placed_at: minutesFromNow(-130), promised_at: null,
        items: [['Caesar Salad', 1]] },
      { customer_name: 'Carla', type: 'delivery', is_vip: true, status: 'preparing',
        placed_at: minutesFromNow(-12), promised_at: minutesFromNow(20),
        items: [['Margherita Pizza', 1]] },
      { customer_name: 'Diego', type: 'takeout', is_vip: false, status: 'received',
        placed_at: tiedPlacedAt, promised_at: minutesFromNow(-5),
        items: [['Margherita Pizza', 1], ['Lemonade', 1]] },
      { customer_name: 'Elisa', type: 'takeout', is_vip: false, status: 'received',
        placed_at: tiedPlacedAt, promised_at: minutesFromNow(-2),
        items: [['Margherita Pizza', 1], ['Lemonade', 1]] },
      { customer_name: 'Bruno', type: 'takeout', is_vip: false, status: 'received',
        placed_at: minutesFromNow(-6), promised_at: minutesFromNow(90),
        items: [['Beef Lasagna', 2]] },
      { customer_name: 'Gabi', type: 'delivery', is_vip: false, status: 'received',
        placed_at: minutesFromNow(-3), promised_at: minutesFromNow(45),
        items: [['Ribeye Steak', 1], ['Lemonade', 1]] },
      { customer_name: 'Heitor', type: 'dine_in', is_vip: false, status: 'ready',
        placed_at: minutesFromNow(-40), promised_at: null,
        items: [['Chicken Wings', 1]] },
      { customer_name: 'Iara', type: 'takeout', is_vip: false, status: 'picked_up',
        placed_at: minutesFromNow(-90), promised_at: minutesFromNow(-50),
        items: [['Tiramisu', 2]] },
      { customer_name: 'Joao', type: 'delivery', is_vip: false, status: 'cancelled',
        placed_at: minutesFromNow(-20), promised_at: minutesFromNow(25),
        items: [['Margherita Pizza', 1]] },
    ];

    await queryInterface.sequelize.transaction(async (transaction) => {
      const menuRows = await queryInterface.bulkInsert('menu_items', MENU, {
        transaction,
        returning: ['id', 'name'],
      });
      const menuIdByName = Object.fromEntries(menuRows.map((r) => [r.name, r.id]));

      for (const { items, ...order } of orders) {
        const [{ id: orderId }] = await queryInterface.bulkInsert('orders', [order], {
          transaction,
          returning: ['id'],
        });
        await queryInterface.bulkInsert(
          'order_items',
          items.map(([name, quantity]) => ({
            order_id: orderId,
            menu_item_id: menuIdByName[name],
            quantity,
          })),
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('order_items', null, { transaction });
      await queryInterface.bulkDelete('orders', null, { transaction });
      await queryInterface.bulkDelete('menu_items', null, { transaction });
    });
  },
};
