'use strict';
const tickersService = require('../services/tickers.service.js'),
  Company = require('mongoose').model('Company'),
  Region = require('mongoose').model('Region');

/**
 * обновляет(добавляет недостающие) список бумаг
 * @return {[type]} [description]
 */
exports.updateCompanies = async function() {
  let regions = await Region.find({});
  for (let region of regions) {
    //получаем все тикеры
    let allTickersId = await tickersService.getAllTickers(region.regionId);
    //назодим в нашей базе существующие
    let updatedTickers = await Company.find({});
    //новые тикеры, по которым нужно узнать инфу и обновить
    let addedTickers = [];
    //находим новые тикеры
    if (allTickersId) {
      for (let ticker of allTickersId) {
        //если все существующие тикеры не равны
        if (updatedTickers.every(el => +el.tickerId !== ticker) || !updatedTickers.length) {
          addedTickers.push(ticker);
        }
      }
    }
    let tickersInfo = await tickersService.getTickersInfo(addedTickers);
    if (tickersInfo) {
      for (let el of tickersInfo) {
        let compName = region.regionId === 1 ? el.Russian : el.English;
        let newCompany = new Company({
          ticker: el.Ticker,
          tickerId: el.Id,
          companyName: compName,
          quote: null,
          region: region.regionId
        });
        await newCompany.save();
      }
    }
  }
  await updateTickerQuotes();
};



/**
 * обновление котировок бумаг
 * @return {[type]} [description]
 */
async function updateTickerQuotes() {
  try {
    let updatedTickers = await Company.find({});
    let tickersId = updatedTickers.map((el) => {
      return el.tickerId
    });

    let tickersQuotes = await tickersService.getTickersCostNewApi(tickersId);
    //tickersQuotes = JSON.parse(tickersQuotes);
    for (let ticker of updatedTickers) {
      let tick = tickersQuotes.find(el => el.Id === ticker.tickerId);

      //создаем объект mongoose и сохраняем в бд каждую бумагу
      let company = new Company(ticker);
      await company.update({
        quote: tick.Cost
      });
    }
    let companies = Company.create(updatedTickers);
  } catch (err) {
    console.log(new Date + '\n' + err);
  }
};
