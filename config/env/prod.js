var mongoose = require('mongoose');

var port = 8080;
const dbURI = 'mongodb://localhost:27017/';
var mongoose = require('mongoose');

module.exports = {
  HOST: 'http://94.130.78.24/',
  dbURI: dbURI,
  appPort: port,
  dbConnect: function(dbToBeConnected) {
    console.log('connecting to MongoDB...' + dbURI + '/' + dbToBeConnected);
    var db = null;
    db = mongoose.connection.openUri(dbURI + dbToBeConnected, {
      useMongoClient: true
    }).then(
      (err, db) => {
        console.log('Connected to mongo server. ');
        return db;
      });
  }
};
