'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const GeocoderService = require("../../../geocoder/service/geocoder.service");
const logger = require("../../../../core/logger");

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

        if (!property.Latitude || !property.Longitude) {
            try {
                const geocodingResponse = await GeocoderService.geocode({
                    address: property.Street + ', ' + property.City + ', ' + property.ZipCode + ', ' + property.State,
                    zipcode: property.ZipCode,
                    city: property.City,
                });

                if (geocodingResponse && geocodingResponse[0]) {
                    property.Latitude = geocodingResponse[0].latitude;
                    property.Longitude = geocodingResponse[0].longitude;
                } else {
                    const addressString = property.Street + ', ' + property.City + ', ' + property.ZipCode + ', ' + property.State;
                    logger.info(`PropertyDAO.prepareUpdateObject() geocoding result is empty for Property ${property._id} : ${property.Title()} - address: ${addressString}`)
                }
            } catch (e) {
                logger.error(`PropertyDAO.prepareUpdateObject():${property._id} geocoding error =  ${e}`)
            }
        }

        return property;
    }
}


module.exports = new PropertyDAO();
