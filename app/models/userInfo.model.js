'use strict';
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
const userInfoSchema = new Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  userName: String,
  balance: Number,
  cash: Number,
  tickers: [{
    tickerId: Number,
    amount: Number,
    _id: false
  }],
}, {
  collection: 'userInfo',
});

module.exports = mongoose.model('UserInfo', userInfoSchema);
