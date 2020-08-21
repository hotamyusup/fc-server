'use strict';

const _ = require('underscore');
const mongoose = require('mongoose');
const moment = require('moment');
const Promise = require('bluebird');

const logger = require('./logger');

class BaseDAO {
    constructor(model) {
        this.model = model;
    }

    fieldDefinition(field) {
        return this.model.schema.path(field)
    }

    fieldExists(field) {
        return !!this.fieldDefinition(field)
    }

    async all(conditions, options, fields) {
        conditions = conditions || {};
        return this.model.find(conditions, fields, options);
    }

    async get(id) {
        return this.model.findOne({_id: id});
    }

    async create(dataObject) {
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
        return this.model.findOneAndUpdate({_id}, preparedJSON, {runValidators: true, upsert: !!upsert, new: true});
    }

    async upsert(dataObject) {
        return this.update(dataObject, true);
    }

    async delete(_id) {
        return this.model.remove({_id});
    }

    aggregate(params) {
        return this.model.aggregate(params);
    }

    async copy(id, changes) {
        const entity = await this.get(id);
        const copiedEntity = await this.copyEntity(entity, changes);
        const createdEntityCopy = await this.create(copiedEntity);
        return createdEntityCopy;
    }

    async copyEntity(entity, changes = {}) {
        const excluded = ['_id', '__v', 'updated_at'];//, 'created_at', 'updated_at'];
        const attributesNames = this.pickSchema(excluded);
        const copiedEntity = _.pick(entity, attributesNames);

        const changedAttributesNames = _.keys(changes);
        const isChanged = changedAttributeName => changedAttributesNames.indexOf(changedAttributeName) > 0;
        const attributeExists = attributeName => attributesNames.indexOf(attributeName) >= 0;

        if (attributeExists('created_at') && !isChanged('created_at')) {
            copiedEntity.created_at = moment().toISOString();
        }
        // if (attributeExists('Title') && !isChanged('Title')) {
        //     copiedEntity.Title = `Copy of ${copiedEntity.Title}`;
        // }

        for (const changeName of changedAttributesNames) {
            const changeHandler = changes[changeName];
            let changeValue = changeHandler;
            if (_.isFunction(changeHandler)) {
                changeValue = changeHandler(copiedEntity, entity);
            }
            if (changeValue instanceof Promise) {
                changeValue = await changeValue;
            }
            copiedEntity[changeName] = changeValue;
        }

        return copiedEntity;
    }

    pickSchema(excluded = []) {
        const fields = [];
        this.model.schema.eachPath(path => (excluded.indexOf(path) < 0) && fields.push(path));
        return fields;
    }

    get collectionName() {
        return this.model.collection.name
    }
}

module.exports = BaseDAO;
