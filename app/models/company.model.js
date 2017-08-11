'use strict';
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
const companySchema = new Schema({
  ticker: String,
  tickerId: {
    type: Number,
    unique: true,
    index: true
  },
  companyName: String,
  quote: Number,
  region: Number
}, {
  collection: 'companies'
});

module.exports = mongoose.model('Company', companySchema);
