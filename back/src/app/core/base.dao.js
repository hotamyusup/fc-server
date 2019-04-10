'use strict';

const mongoose = require('mongoose');
const moment = require('moment');
const Promise = require('bluebird');

class BaseDAO {

    constructor(model) {
        this.model = model;
    }

    all(conditions) {
        conditions = conditions || {};
        return this.model.find(conditions);
    }

    get(id) {
        return this.model.findOne({_id: id});
    }

    create(dataObject) {
        const newModel = new this.model(dataObject);
        return newModel.save();
    }

    async prepareUpdateObject(dataObject) {
        // delete dataObject._id;
        // delete dataObject.created_at;
        // delete dataObject.__v;

        // hack for devices with corrupted InstallationDate
        if (dataObject.InstallationDate === 'Invalid date') {
            if (dataObject.created_at || dataObject.updated_at) {
                dataObject.InstallationDate = moment(dataObject.created_at || dataObject.updated_at).toISOString();
            }
        }

        dataObject.updated_at = moment().toISOString();

        return Promise.resolve(dataObject);
    }

    async update(dataObject, upsert) {
        const _id = dataObject._id;
        const preparedJSON = await this.prepareUpdateObject(dataObject);
        return this.model.findOneAndUpdate({_id}, preparedJSON, {runValidators : true, upsert: !!upsert});
    }

    upsert(dataObject) {
        return this.update(dataObject, true);
    }

    delete(id) {
        return this.model.remove({_id : id});
    }
}

module.exports = BaseDAO;
