const { createApp } = require('./app');
const { createOrdersService } = require('./modules/orders/ordersService');
const orderRepository = require('./repositories/orderRepository');

const PORT = Number(process.env.PORT || 4000);

const app = createApp({
  ordersService: createOrdersService({ orderRepository }),
  clock: () => new Date(),
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
