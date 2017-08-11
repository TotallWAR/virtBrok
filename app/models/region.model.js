'use strict';
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
const regionSchema = new Schema({
  regionId: Number,
  name: String
}, {
  collection: 'regions'
});

module.exports = mongoose.model('Region', regionSchema);
