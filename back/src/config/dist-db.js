'use strict';
const Mongoose = require('mongoose');
const config = require('./config');
const logger = require('../app/core/logger');

//console.log(config);
logger.info('connecting database... ' + config.database.url);

var db = Mongoose.connect(config.database.url, {
    useMongoClient: true,
});

db.on('error', function (err) {
    logger.error(`connection error ${err}`);
});
db.once('open', function callback() {
    logger.info('Connection with database succeeded!');
});

const onDBConnected = new Promise(resolve => db.once('open', resolve));


Mongoose.Promise = require('bluebird');

exports.Mongoose = Mongoose;
exports.db = db;
exports.onDBConnected = onDBConnected;
