'use strict';
const brokerController = require('../controllers/broker.controller.js');

module.exports = (app, route, koaBody) => {
  route.post('/openBill', koaBody, async(ctx, next) => {
    await brokerController.openBill(ctx);
  });

  route.post('/createOrderRequest', koaBody, async(ctx, next) => {
    await brokerController.createOrderRequest(ctx, next);
  });
};
