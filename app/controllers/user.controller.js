'use strict';
const tickersService = require('../services/tickers.service.js');
let UserInfo = require('mongoose').model('UserInfo'),
  Order = require('mongoose').model('Order'),
  Company = require('mongoose').model('Company');


exports.getUserInfo = async(ctx, next) => {
  try {
    let userInfo = await UserInfo.findOne({
      userId: ctx.params.userId
    }).exec();
    if (userInfo) {
      userInfo = await userInfo.toObject();
      //получение котировок бумаг из portfolioand.me
      //let costs = tickersService.getTickersCost(userInfo.tickers);
      let companiesInfo = await Company.find({
        tickerId: {
          $in: userInfo.tickers.map(el => {
            return el.tickerId
          })
        }
      });
      userInfo.tickers.forEach((ticker) => {
        let company = companiesInfo.find(el => el.tickerId == ticker.tickerId);
        if (company) {
          ticker.companyName = company.companyName;
        } else {
          ticker.companyName = null;
        }
      });
      ctx.status = 200;
      ctx.body = userInfo;
    } else {
      ctx.throw(404, 'User not found');
    }
  } catch (e) {
    ctx.throw(404, e.message);
  }
};

exports.getUserOrders = async(ctx, next) => {
  try {
    let userOrders = await Order.find({
      userId: ctx.params.userId
    });
    ctx.status = 200;
    ctx.body = userOrders;
  } catch (e) {
    ctx.throw(500, e.message);
  }
}

//cнятие
exports.withdrawal = async(ctx, next) => {
  try {
    let order = new Order({
      userId: ctx.request.body.userId,
      summPrice: ctx.request.body.cash,
      status: 'pending',
      type: 'сashWithdrawal'
    });
    let result = await order.save();
    ctx.status = 200;
    ctx.body = 'Order has beed queued. It will be executed during the next trade session.';
  } catch (e) {
    ctx.throw(500, e.message);
  }
};

//cash, userId
exports.refillAccount = async(ctx, next) => {
  try {
    let order = new Order({
      userId: ctx.request.body.userId,
      summPrice: ctx.request.body.cash,
      status: 'pending',
      type: 'cashRefill'
    });
    let result = await order.save();
    ctx.status = 200;
    ctx.body = 'Order has beed queued. It will be executed during the next trade session.';
  } catch (e) {
    ctx.throw(500, e.message);
  }
};
