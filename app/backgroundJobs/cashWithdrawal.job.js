'use strict';
//models
let Order = require('mongoose').model('Order');
let UserInfo = require('mongoose').model('UserInfo');
const brokerController = require('../controllers/broker.controller.js');

exports.checkCashWithdrawalOrders = async() => {
  console.log("Checking of Orders With Cash withdrawal is launched: " + new Date());
  let orders = await Order.find({
    status: "pending"
  });
  //если есть ордеры с статусом пендинг и сейчас торговая сессия
  if (orders && brokerController.isTradeSession()) {
    //отсортировать по дате и времени
    orders = orders.sort((a, b) => a.date - b.date);
    for (let order of orders) {
      let user = await UserInfo.findOne({
        userId: order.userId
      });
      if (user) {
        switch (order.type) {
          case 'сashWithdrawal':
            {
              //если не хватает на счету денег
              if (order.summPrice > user.cash) {
                order.status = 'declined';
                order.reason = 'Not enough cash';
                await order.save();
                continue;
              }
              //изменяем кэш юзера
              user.cash -= order.summPrice;
              user.balance -= order.summPrice;
              break;
            }
          case 'cashRefill':
            {
              //изменяем кэш юзера
              user.cash += order.summPrice;
              user.balance += order.summPrice;
              break;
            }

          default:
            //Error
            continue;
        }
        //сохранение изменений
        let resultUserSave = await user.save();
        order.reason = null;
        order.status = "done";
        let resultOrderSave = await order.save();
      } else {
        continue;
      }
    }
  }
  return;
}
