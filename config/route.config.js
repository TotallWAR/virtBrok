'use strict';
const Router = require('koa-router');

module.exports = (app, koaBody) => {
  // routes
  const router = new Router();

  const userRoute = require('../app/routes/user.route.js')(app, router, koaBody);
  const brokerRoute = require('../app/routes/broker.route.js')(app, router, koaBody);
  return router;

};
