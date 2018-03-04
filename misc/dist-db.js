const Mongoose = require('mongoose');
const logger = require('../logger');
const config = require('./config');

//console.log(config);
logger.info('connecting database... ' + config.database.url);

var db = Mongoose.connect(config.database.url, {
  useMongoClient: true,
});

db.on('error', function(err) {
  logger.error(`connection error ${err}`);
});
db.once('open', function callback() {
  logger.info('Connection with database succeeded!');
});


Mongoose.Promise = require('bluebird');

exports.Mongoose = Mongoose;
exports.db = db;
