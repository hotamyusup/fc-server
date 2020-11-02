'use strict';

const moment = require('moment');
const mongoose = require('mongoose');
const Promise = require('bluebird');
const BaseDAO = require('../../../core/base.dao');

class PropertyChildrenBaseDAO extends BaseDAO {
    constructor(model) {
        super(model);
    }

    forProperty(PropertyID) {
        return this.model.find({PropertyID});
    }

    forBuilding(BuildingID) {
        return this.model.find({BuildingID});
    }

    forFloor(FloorID) {
        return this.model.find({FloorID});
    }

    forDevice(DeviceID) {
        return this.model.find({DeviceID});
    }

    forDate(date = new Date(), additionalConditions) {
        const findForDateConditions = {
            created_at: {
                $gte: moment(date).startOf('day').toDate(),
                $lte: moment(date).endOf('day').toDate()
            },
            ...additionalConditions
        };

        return this.all(findForDateConditions)
    }

    delete(id) {
        console.log(`delete(${id})`);
        return this.update({_id: id, Status: -1});
    }

    async prepareUpdateObject(propertyEntityJSON) {
        const propertyEntity = await super.prepareUpdateObject(propertyEntityJSON);
        if (propertyEntity.QRCode) {
           if (`${propertyEntity.QRCode}`.substr(-2) === '.0') {
                propertyEntity.QRCode = `${parseInt(propertyEntity.QRCode)}`;
           }
        }
        return propertyEntity;
    }
}

module.exports = PropertyChildrenBaseDAO;
