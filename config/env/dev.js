var port = 8080;
const dbURI = 'mongodb://localhost:27018/';

var mongoose = require('mongoose');
var tunnel = require('tunnel-ssh');

var config = {
  username: 'скрыто',
  host: 'скрыто',
  agent: process.env.SSH_AUTH_SOCK,
  privateKey: require('fs').readFileSync('/Users/aleksandrvadimovic/.ssh/id_rsa'),
  passphrase: 'скрыто',
  port: 123,
  dstPort: 123
};

module.exports = {
  HOST: 'http://localhost:3000',
  dbURI: dbURI,
  appPort: port,
  dbConnect: async function(dbToBeConnected) {
    console.log('connecting to MongoDB...' + dbURI + '/' + dbToBeConnected);
    try {
      var tnl = tunnel(config, async function(error, tnl) {
        if (error) {
          console.log("SSH connection error: " + error);
        }
        var db = null;
        db = await mongoose.connection.openUri(dbURI + dbToBeConnected, {
          useMongoClient: true
        });
        console.log('Connected to MongoDB.');
        mongoose.connection.on('disconnected', function() {
          console.log('Mongoose default connection disconnected');
          tnl.close();
        });
        return db;
      });
    } catch (e) {
      console.log(e);
    }
  }
};
