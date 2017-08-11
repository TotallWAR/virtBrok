'use strict';
let request = require('koa2-request');
let endpoints = require('../../config/apiEndpoints');

exports.getTickersCostNewApi = async(tickers) => {
  if (tickers.length) {
    try {
      var options = {
        url: endpoints.tickerApi + '/GETPRICES',
        method: 'post',
        headers: {
          'User-Agent': 'request',
          'content-type': 'application/json',
          'charset': 'UTF-8'
        },
        json: true,
        body: {
          tickers: tickers
        }
      };
      var result = await request(options);
      return result.body;
    } catch (e) {
      return undefined;
    }
  } else {
    return new Promise((resolve, reject) => {
      resolve(null)
    });
  }
};

//с старого апи осталось, но еще используется
exports.getTickersCost = async(tickers) => {
  if (tickers.length) {
    try {
      var options = {
        url: endpoints.portfolioTickerQuotes,
        method: 'post',
        headers: {
          'User-Agent': 'request',
          'content-type': 'application/json',
          'charset': 'UTF-8'
        },
        json: true,
        body: {
          tickers: tickers
        }
      };
      var result = await request(options);
      return result.body;
    } catch (e) {
      return undefined;
    }
  } else {
    return new Promise((resolve, reject) => {
      resolve(null)
    });
  }
};

//в ответе массив айдишников бумаг
exports.getAllTickers = async(region) => {
  if (region) {
    try {
      var options = {
        url: endpoints.tickerApi + '/GETSTOCKS?region=' + region,
        method: 'get',
        headers: {
          'User-Agent': 'request',
          'content-type': 'application/json',
          'charset': 'UTF-8'
        },
        json: true
      };
      var result = await request(options);
      return result.body;
    } catch (err) {

    }
  } else {
    return new Promise((resolve, reject) => {
      resolve(null)
    });
  }
};
/**
 * получение информации по айди тикера - названия, тикеры
 * @type {Array} tickers массив тикеров
 * @return {Array} массив объектов {id, название, на англ и на рус, тикер}
 */
exports.getTickersInfo = async(tickers) => {
  if (tickers.length) {
    try {
      var options = {
        url: endpoints.tickerApi + '/GETTITLES',
        method: 'post',
        headers: {
          'User-Agent': 'request',
          'content-type': 'application/json',
          'charset': 'UTF-8'
        },
        json: true,
        body: {
          tickers: tickers
        }
      };
      var result = await request(options);
      return result.body;
    } catch (err) {

    }
  } else {
    return new Promise((resolve, reject) => {
      resolve(null)
    });
  }
};
