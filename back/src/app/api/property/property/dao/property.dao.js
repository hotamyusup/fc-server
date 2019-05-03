'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const geocoder = require('node-geocoder')('google', 'http');

const logger = require("../../../../core/logger");
const BaseDAO = require("../../../../core/base.dao");

const PropertyModel = require("../model/property.model");
const PropertyChildrenBaseDAO = require("../../common/property.children.base.dao");

class PropertyDAO extends PropertyChildrenBaseDAO {
    constructor() {
        super(PropertyModel);
    }

    async getPropertiesForOrganization(organizationID) {
        return this.model.find({Organization: organizationID});
    }

    async getPropertiesIdsForOrganization(organizationID) {
        const properties = await this.model.find({Organization: organizationID});
        return properties.map(p => p._id);
    }

    async prepareUpdateObject(propertyJSON) {
        const property = await super.prepareUpdateObject(propertyJSON);

        const coords = await geocode({
            address: property.Street + ', ' + property.City + ', ' + property.zipcode + ', ' + property.State,
            zipcode: property.ZipCode,
            city: property.City,
        });

        if (coords) {
            property.Latitude = coords.latitude;
            property.Longitude = coords.longitude;
        }

        return property;
    }
}

const geocode = (geoObject) => {
    return new Promise((resolve, reject) => {
        geocoder.geocode(geoObject, function (err, res) {
                if (!err) {
                    if (!err && res.length > 0) {
                        resolve({
                            latitude: res[0].latitude,
                            longitude: res[0].longitude
                        })
                    } else {
                        resolve();
                    }
                } else {
                    logger.error(`gecoder error ${err}, return undefined coordinates`);
                    // reject(err);
                    resolve();
                }
            }
        );
    })
};

module.exports = new PropertyDAO();
