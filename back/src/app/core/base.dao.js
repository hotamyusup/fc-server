'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const geocoder = require('node-geocoder')('google', 'http');

const logger = require("./logger");

class BaseDAO {

    constructor(model) {
        this.model = model;
    }

    all() {
        return this.model.find({});
    }

    get(id) {
        return this.model.findOne({_id: id});
    }

    create(dataObject) {
        const property = new PropertyModel(dataObject);
        return property.save();
    }

    update(dataObject, upsert) {
        const _id = dataObject._id;
        delete dataObject._id;

        return this.model.update({_id}, dataObject, {upsert: !!upsert});
    }
}

module.exports = BaseDAO;
