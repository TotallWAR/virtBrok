'use strict';
const tickersService = require('../services/tickers.service.js'),
  tradeSession = require('../vars').tradeSession;
let UserInfo = require('mongoose').model('UserInfo'),
  Order = require('mongoose').model('Order'),
  Promise = require('bluebird'),
  Company = require('mongoose').model('Company');


exports.openBill = async(ctx) => {
  if (ctx.request.body.userId !== undefined) {
    let userInfo = new UserInfo({
      userId: ctx.request.body.userId,
      userName: ctx.request.body.userName,
      //ставим баланс=cash, так как при открытии счета нет еще бумаг никаких
      balance: ctx.request.body.cash,
      cash: ctx.request.body.cash,
      tickers: []
    });
    try {
      let result = await userInfo.save();
      if (result) {
        ctx.status = 201;
        ctx.body = "The bill is created successfully.";
      }
    } catch (e) {
      ctx.status = 400;
      ctx.body = e.message;
    }
  } else {
    ctx.throw(400, "Empty userId.");
  }
};

exports.createOrderRequest = async(ctx, next) => {
  const USERID = ctx.request.body.userId;
  const TICKERS_ID_ARRAY = ctx.request.body.tickers.map((el) => {
    return el.tickerId
  });
  const REQUEST_TICKERS = ctx.request.body.tickers;
  let user = await UserInfo.findOne({
    userId: USERID
  });
  if (user) {
    let order = new Order({
      userId: USERID
    });
    //проверка торговая ли сессия
    if (this.isTradeSession()) {
      //получение котировок на бумаги
      //старый вариант - тоже работает
      //let tickerQuotes = await tickersService.getTickersCost(TICKERS_ID_ARRAY);
      let tickerQuotes = await Company.find({
        tickerId: {
          $in: TICKERS_ID_ARRAY
        }
      });
      let tickerQuotesObject = {};
      tickerQuotes.forEach(el => tickerQuotesObject[el.tickerId] = el.quote)

      //если ничего не вернуло апи
      if (!Object.keys(tickerQuotesObject).length) {
        try {
          //создание временного пользователя на 24 часа
          await this.makePendingOrder(ctx, order);
          await this.saveOrder(ctx, order);
          return;
        } catch (err) {
          ctx.throw(500, err.message);
        }
        //если апи ничего не вернуло, то
        //формируем ордер и ставим в ожидание


      }
      switch (ctx.request.body.type) {
        case 'buy':
          {
            //добавляем бумаги в портфель пользователя
            let addedTicker = this.addTickersInPortfel(user, REQUEST_TICKERS);
            if (!addedTicker.length) {
              ctx.throw(400, "Error with parameters of request", {
                expose: true
              });
            }
            //получаем суммарный прайс бумаг, которые покупаем
            let priceOfBuyingTickers = this.getSummTickerPrice(tickerQuotesObject, addedTicker);
            //если не хватает на счету денег
            if (priceOfBuyingTickers > user.cash) {
              order.status = 'declined';
              order.reason = 'Not enough cash';
              await order.save();
              ctx.throw(403, "User does not have enough money", {
                expose: true
              });
            }
            //формируем заказ
            order.type = 'buy';
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
            let removedTickers = this.removeTickersFromPortfel(user, REQUEST_TICKERS);
            if (!removedTickers.length) {
              let message = 'Error with parameters of request. Probably user does not have tickers';
              order.status = 'declined';
              order.reason = message;
              await order.save();
              ctx.throw(400, message);
            }
            //получаем суммарный прайс бумаг, которые продаем
            let priceOfRemovedTickers = this.getSummTickerPrice(tickerQuotesObject, removedTickers);
            //формируем заказ
            order.type = 'sell';
            order.summPrice = priceOfRemovedTickers;
            order.tickers = removedTickers;

            //изменяем кэш юзера
            //баланс такой же, т.к. он меняется только в ходе изменения котировок и пополнении кэша
            user.cash += priceOfRemovedTickers;
            break;
          }

        default:
          ctx.throw(400, "Type of trade is not defined");
      }
      // сохраняем изменения в юзере и заказе
      let resultUserSave = await user.save();
      order.status = "done";
      let resultOrderSave = await order.save();

      if (!resultUserSave || !resultOrderSave) {
        throw ('Error during saving order.');
      } else {
        ctx.status = 201;
        ctx.body = "Portfolio updated successfully.";
      }
    } else {
      //если не торговая сессия, то
      //формируем ордер и ставим в ожидание
      await this.makePendingOrder(ctx, order);
      try {
        let result = order.save();
        if (result) {
          ctx.status = 200;
          ctx.body = "The trade session has not been started yet. Order has been queued."
        }
      } catch (e) {
        ctx.throw(400, e.message);
      }
    }
  } else {
    ctx.throw(404, "User not found")
  }
};
/**
 * определяет торговая ли сейчас сессия
 * @return {Boolean} true если сейчас торг сессия, false, если нет
 */
exports.isTradeSession = () => {
  //здесь описать логику проверки времени торговли сессии
  let timeNow = new Date();
  if (timeNow < tradeSession.START_DAY_MOSCOW_TRADE_SESSION ||
    (timeNow > tradeSession.END_DAY_MOSCOW_TRADE_SESSION &&
      timeNow < tradeSession.START_EVENING_MOSCOW_TRADE_SESSION) ||
    timeNow > tradeSession.END_EVENING_MOSCOW_TRADE_SESSION) {
    return false;
  }
  return true;
}

/**
 * считает суммарную стоимость тикеров
 * @param  {object} tickerQuotes котировки тикеров
 * @param  {array} tickers      массив тикеров вида
 * "tickers" : {
	     "38832":{"amount":5},
	     "87530":{"amount":5}
   }
 * @return {number}             суммарная стоимость тикеров
 */
exports.getSummTickerPrice = (tickerQuotes, tickers) => {
  let result = 0;
  if (tickerQuotes && tickers.length) {
    result = Object.keys(tickerQuotes).reduce(function(sum, current) {
      return sum + tickerQuotes[current] * tickers.find(el => el.tickerId == current).amount;
    }, 0);
  }
  return result;
}

/**
* добавляет бумаги в портфель пользователя (добавляет все бумаги из второго параметра)
* @param {object} user    объект пользователя
* @param {array} tickers бумаги, которые нужно добавить вида
* [
    {"tickerId": "38832", "amount":1},
    {"tickerId" :"87530", "amount":1}
 ]
 * @return {array}         добавленные бумаги
 */
exports.addTickersInPortfel = (user, tickers) => {
  let addedTickers = [];
  if (user.tickers && user.tickers.length) {
    tickers.forEach((ticker) => {
      addedTickers.push(ticker);
      //если ни одному не равен
      if (user.tickers.every(existingTicker => existingTicker.tickerId !== ticker.tickerId)) {
        user.tickers.push({
          "tickerId": ticker.tickerId,
          "amount": tickerId.amount
        });
      } else {
        user.tickers.find(el => el.tickerId === ticker.tickerId).amount += ticker.amount;
      }
    });
  } else {
    user.tickers = tickers;
    addedTickers = tickers;
  }
  return addedTickers;
}

/**
* удаляет бумаги из портфеля пользователя (продаст(удалит) те бумаги,
* у которых хватает количества из существующего портфеля)
* @param {object} user    объект пользователя
* @param {arrat} tickers бумаги, которые нужно удалить вида
* [
    {"tickerId": "38832", "amount":1},
    {"tickerId" :"87530", "amount":1}
 ]
 * @return {array}         удаленные бумаги
 */
exports.removeTickersFromPortfel = (user, tickers) => {
  let removedTickers = [];
  if (user.tickers && user.tickers.length) {
    tickers.forEach((ticker) => {
      //ищем бумагу у юзера
      let currentUserTicker = user.tickers.find(el => ((el.tickerId === ticker.tickerId) &&
        (el.amount - ticker.amount) >= 0));
      //если у юзера есть такой тикер и у него хватает кол-ва его продать
      if (currentUserTicker) {
        //если продал все существующие бумаги
        removedTickers.push(ticker);
        if (!(currentUserTicker.amount - ticker.amount)) {

          user.tickers.splice(user.tickers.findIndex(el => el.tickerId === ticker.tickerId), 1);
        } else {
          currentUserTicker.amount -= ticker.amount;
        }
      }
    });
  }
  return removedTickers;
}

/**
 * формирование заказа с статусом pending
 * @param  {Object} ctx   контекст запроса - объект koa2
 * @param  {Object} order экземпляр модели монгодб Order
 */
exports.makePendingOrder = function(ctx, order) {
  return new Promise((resolve, reject) => {
    if (ctx.request.body.type === 'buy' || ctx.request.body.type === 'sell') {
      order.userId = ctx.request.body.userId;
      order.tickers = ctx.request.body.tickers;
      order.type = ctx.request.body.type;
      order.status = "pending";
      order.reason = 'Not trade session or problems with quotes-service';
      resolve();
    } else {
      ctx.throw(400, "Type of trade is not defined");
      reject();
    }
  });
}

/**
 * сохранение заказа и возврат статуса клиенту
 * @param  {Object} ctx   контекст запроса - объект koa2
 * @param  {Object} order экземпляр модели монгодб Order
 */
exports.saveOrder = function(ctx, order) {
  return new Promise(async(resolve, reject) => {
    try {
      let result = await order.save();
      if (result) {
        ctx.status = 200;
        ctx.body = "The trade session has not been started yet. Or there are other problems with quotes-service. Order has been queued."
        resolve();
      }
    } catch (e) {
      ctx.throw(400, e.message);
      reject();
    }
  });
}
