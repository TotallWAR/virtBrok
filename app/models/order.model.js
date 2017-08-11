'use strict';
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
const orderSchema = new Schema({
  userId: String,
  type: String,
  date: {
    type: Date,
    default: Date.now
  },
  tickers: [{
    tickerId: Number,
    amount: Number,
    _id: false
  }],
  summPrice: Number,
  status: String,
  reason: String
}, {
  collection: 'orders'
});

module.exports = mongoose.model('Order', orderSchema);
