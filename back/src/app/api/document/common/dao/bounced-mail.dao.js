'use strict';

const _ = require('underscore');
const mongoose = require('mongoose');
const Promise = require('bluebird');

const BaseDAO = require('../../../../core/base.dao');
const PropertyDAO = require('../../../property/property/dao/property.dao');
const DocumentDAO = require('./document.dao.instance');

class BouncedMailDAO extends BaseDAO {
    constructor(model) {
        super(model);
    }

    async lastCreated() {
        const lastCreatedModel = await this.model.findOne({}, {}, {sort: {created: -1}}).exec();
        return lastCreatedModel ? lastCreatedModel.created : undefined;
    }

    forProperty(PropertyID) {
        return DocumentDAO.aggregate([
            {
                $match: {
                    PropertyID: mongoose.Types.ObjectId(PropertyID)
                }
            },
            {
                $lookup: {
                    from: "BouncedMail",
                    localField: "signer.email",
                    foreignField: "email",
                    as: "Bounce"
                }
            },
            // {
            //     $unwind: '$Bounce'
            // },
            // {
            //     $project: {
            //         _id: 0,
            //         EquipmentTypeID: '$_id',
            //         EquipmentTypeTitle: '$Title',
            //         DeviceTypeID: '$Devices._id',
            //         DeviceTypeTitle: '$Devices.Title'
            //     }
            // },
            // {
            //     $out: temp_equipment_devices
            // }
        ])
    }

    async update(dataObject, upsert) {
        const {email} = dataObject;
        const preparedJSON = await this.prepareUpdateObject(dataObject);
        return this.model.findOneAndUpdate({email}, preparedJSON, {runValidators: true, upsert: !!upsert, new: true});
    }
}

module.exports = BouncedMailDAO;
