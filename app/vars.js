'use strict';
//константы

//константы для старта и конца торговой сессии по Москве
let currentDate = new Date();
const tradeSession = {
  START_DAY_MOSCOW_TRADE_SESSION: new Date(currentDate.getFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(), 10, 0, 1),
  END_DAY_MOSCOW_TRADE_SESSION: new Date(currentDate.getFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(), 18, 0, 0),

  START_EVENING_MOSCOW_TRADE_SESSION: new Date(currentDate.getFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(), 19, 0, 1),
  END_EVENING_MOSCOW_TRADE_SESSION: new Date(currentDate.getFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate(), 23, 50, 0),
};

module.exports.tradeSession = tradeSession;
