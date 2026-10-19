const express = require('express');
const { serializeQueue, serializeOrder } = require('./serializers');

function createOrdersRouter({ ordersService, clock }) {
  const router = express.Router();

  router.get('/queue', async (req, res) => {
    const queue = await ordersService.getQueue({ statusFilter: req.query.status, now: clock() });
    res.json(serializeQueue(queue));
  });

  router.post('/:id/:action', async (req, res) => {
    const order = await ordersService.applyAction({
      orderId: req.params.id,
      action: req.params.action,
    });
    res.json({ order: serializeOrder(order) });
  });

  return router;
}

module.exports = { createOrdersRouter };
