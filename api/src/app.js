const express = require('express');
const { createOrdersRouter } = require('./http/ordersRouter');
const { errorHandler, notFoundHandler } = require('./http/errorHandler');

const systemClock = () => new Date();

function createApp({ ordersService, clock = systemClock }) {
  const app = express();
  app.use(express.json());
  app.use('/orders', createOrdersRouter({ ordersService, clock }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
