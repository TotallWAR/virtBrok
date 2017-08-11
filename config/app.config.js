'use strict';
module.exports = (app) => {
  // sessions
  const session = require('koa-generic-session');
  const convert = require('koa-convert');
  const MongoStore = require('koa-generic-session-mongo');
  const koaBody = require('koa-body')();
  var cors = require('kcors');


  app.keys = ['your-session-secret', 'another-session-secret'];
  app.use(convert(session({
    store: new MongoStore()
  })));

  // body parser
  //const bodyParser = require('koa-bodyparser');
  //app.use(bodyParser());

  app.use(cors({
    // origin: function(ctx) {
    //   let reg = /http:\/\/localhost:*/g
    //   if (ctx.url.search(reg) === -1) {
    //     return false;
    //   }
    //   return '*';
    // },
    origin: '*',
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 10, //Количество секунд, на которое запрос может быть кэширован.
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));

  const serve = require('koa-static');
  // serve files in public folder (css, js etc)
  app.use(serve(__dirname + '/../public'));

  const routes = require('../config/route.config.js');
  //const routeConfig = require('../config/route.config.js')(app, passport);
  const route = routes(app, koaBody);
  app.use(route.routes());
};



/*
счет
201 - успешно создан счет
400 - какие-то ошибки в переданных параметрах и счет не создан

ордер

400 - какие-то ошибки в переданных параметрах и ордер не создан
403 - не хватает бабла на счету для проведения операции - заказ будет создан, но будет записано diclined
404 - юзер для создания ордера не найден - такой не зарегистрирован в виртуальном брокере (надо сделать openBill)
201 - ордер успешно создан и проведен
200 - ордер создан но у него статус пендинг
 */
