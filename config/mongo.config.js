'use strict';
const mongoose = require('mongoose');
//используем bluebird промисы, а не промисы из mongoose
mongoose.Promise = require('bluebird');

const envCfg = require('./env/' + process.env.NODE_ENV + '.js');
// MongoDB
module.exports = async() => {
  require('../app/models/userInfo.model.js');
  require('../app/models/order.model.js');
  require('../app/models/company.model.js');
  require('../app/models/region.model.js');
  let db = null;
  try {
    db = await envCfg.dbConnect('virtualBank');
  } catch (e) {
    console.log(e);
  }

  return db;
};
