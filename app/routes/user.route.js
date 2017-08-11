'use strict';
let userController = require('../../app/controllers/user.controller.js');
module.exports = (app, route, koaBody) => {

  route.get('/getUserInfo/:userId', koaBody, async(ctx, next) => {
    await userController.getUserInfo(ctx, next);
  });

  route.get('/getUserOrders/:userId', koaBody, async(ctx, next) => {
    await userController.getUserOrders(ctx, next);
  });

  route.post('/withdrawal', koaBody, async(ctx, next) => {
    await userController.withdrawal(ctx, next);
  });

  route.post('/refillAccount', koaBody, async(ctx, next) => {
    await userController.refillAccount(ctx, next);
  });


};
