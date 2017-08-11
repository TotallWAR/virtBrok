'use strict';
//models
let Order = require('mongoose').model('Order'),
  UserInfo = require('mongoose').model('UserInfo'),
  Company = require('mongoose').model('Company');
//controllers/services
const brokerController = require('../controllers/broker.controller.js');
const tickersService = require('../services/tickers.service.js');

exports.checkStatusOrder = async() => {
  console.log("CheckStatusOrder is launched: " + new Date());
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
        //массив айдишников бумаг
        const TICKERS_ID_ARRAY = order.tickers.map((el) => {
          return el.tickerId
        });
        //получение цен на бумаги
        let tickerQuotes = await Company.find({
          tickerId: {
            $in: TICKERS_ID_ARRAY
          }
        });
        let tickerQuotesObject = {};
        tickerQuotes.forEach(el => tickerQuotesObject[el.tickerId] = el.quote)

        if (!Object.keys(tickerQuotesObject).length) {
          //если апи ничего не вернуло, то
          //формируем ордер и ставим в ожидание
          await makePendingOrder(order);
          await saveOrder(order);
          return;
        }
        switch (order.type) {
          case 'buy':
            {
              //добавляем бумаги в портфель пользователя
              let addedTicker = brokerController.addTickersInPortfel(user, order.tickers);
              if (!addedTicker.length) {
                //Error
                continue;
              }
              // получение суммарной стоимости всех приобритаемых бумаг
              let priceOfBuyingTickers = brokerController.getSummTickerPrice(tickerQuotesObject, addedTicker);
              //если не хватает на счету денег
              if (priceOfBuyingTickers > user.cash) {
                order.status = 'declined';
                order.reason = 'Not enough cash';
                await order.save();
                continue;
              }
              //формируем заказ
              order.tickers = addedTicker;
              order.summPrice = priceOfBuyingTickers;

              //изменяем кэш юзера
              //баланс такой же, т.к. он меняется только в ходе изменения котировок и пополнении кэша
              user.cash -= priceOfBuyingTickers;
              break;
            }
          case 'sell':
            {
              //удаляем бумаги из портфеля пользователя
              let removedTickers = brokerController.removeTickersFromPortfel(user, order.tickers);
              if (!removedTickers.length) {
                order.status = 'declined';
                order.reason = "Error with parameters of request. Probably user does not have tickers";
                await order.save();
                continue;
              }
              //получение суммарной стоимости продаваемых бумаг
              let priceOfRemovedTickers = brokerController.getSummTickerPrice(tickerQuotesObject, removedTickers);
              //формируем заказ
              order.summPrice = priceOfRemovedTickers;
              order.tickers = removedTickers;
              //изменяем кэш юзера
              //баланс такой же, т.к. он меняется только в ходе изменения котировок и пополнении кэша
              user.cash += priceOfRemovedTickers;
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


/**
 * формирование заказа с статусом pending
 * @param  {Object} order экземпляр модели монгодб Order
 * @return {Promise}
 */
function makePendingOrder(order) {
  return new Promise((resolve, reject) => {
    if (order.type === 'buy' || order.type === 'sell') {
      order.status = "pending";
      order.reason = 'Not trade session or problems with quotes-service';
      resolve();
    } else {
      reject('LOG: Order type is not buy or sell. Check this order.');
    }
  });
}

/**
 * сохранение заказа и возврат статуса клиенту
 * @param  {Object} order экземпляр модели монгодб Order
 * @return {Promise}
 */
function saveOrder(order) {
  return new Promise(async(resolve, reject) => {
    try {
      let result = await order.save();
      if (result) {
        resolve();
      }
    } catch (e) {
      reject();
    }
  });
}
