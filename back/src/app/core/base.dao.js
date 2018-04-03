'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

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
        const newModel = new this.model(dataObject);
        return newModel.save();
    }

    prepareUpdateObject(dataObject) {
        delete dataObject._id;
        delete dataObject.created_at;
        return Promise.resolve(dataObject);
    }

    async update(dataObject, upsert) {
        const _id = dataObject._id;
        const preparedJSON = await this.prepareUpdateObject(dataObject);
        return this.model.update({_id}, preparedJSON, {upsert: !!upsert});
    }

    upsert(dataObject) {
        return this.update(dataObject, true);
    }

    delete(id) {
        return this.model.remove({_id : id});
    }
}

module.exports = BaseDAO;
