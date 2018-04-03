'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const geocoder = require('node-geocoder')('google', 'http');

const logger = require("../../../../core/logger");
const BaseDAO = require("../../../../core/base.dao");

const PropertyModel = require("../model/property.model");

class PropertyDAO extends BaseDAO {
    constructor() {
        super(PropertyModel);
    }

    all() {
        return PropertyModel.find({}).where('Status').gt(-1);
    }

    get(propertyID) {
        return PropertyModel.findOne({_id: propertyID});
    }

    create(propertyJSON) {
        const property = new PropertyModel(propertyJSON);
        return property.save();
    }

    update(propertyJSON, property) {
        return this
            .get(propertyJSON._id)
            .then(property => this.updateModel(property, propertyJSON));
    }

    updateModel(property, propertyJSON) {
        if (!property) {
            return Promise.reject();
        }

        property.Title = propertyJSON.Title;
        property.Street = propertyJSON.Street;
        property.City = propertyJSON.City;
        property.State = propertyJSON.State;
        property.ZipCode = propertyJSON.ZipCode;
        property.OccupancyUse = propertyJSON.OccupancyUse;
        property.ConstructionType = propertyJSON.ConstructionType;
        property.Stories = propertyJSON.Stories;
        property.YearConstructed = propertyJSON.YearConstructed;
        property.Organization = propertyJSON.Organization;
        property.PropertyManager = propertyJSON.PropertyManager;
        property.QRCode = propertyJSON.QRCode;
        property.Map = propertyJSON.Map;
        property.Picture = propertyJSON.Picture;
        property.Latitude = propertyJSON.Latitude;
        property.Longitude = propertyJSON.Longitude;
        //property.Buildings = propertyJSON.Buildings;
        property.Contacts = propertyJSON.Contacts;
        property.Status = propertyJSON.Status;
        property.Adddate = propertyJSON.AddDate;
        property.created_at = propertyJSON.created_at;
        property.updated_at = propertyJSON.updated_at;

        return geocode({
            address: property.Street +
            ', ' +
            property.City +
            ', ' +
            property.zipcode +
            ', ' +
            property.State,
            zipcode: property.ZipCode,
            city: property.City,
        }).then(coords => {
            if (coords) {
                property.Latitude = coords.latitude;
                property.Longitude = coords.longitude;
            }
            return property.save();
        })
    }

    upsert(propertyJSON) {
        const propertyId = propertyJSON._id;

        return this.get(propertyId)
            .then(property => property
                ? this.updateModel(property, propertyJSON)
                : this.create(propertyJSON)
            );
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
                    reject(err);
                }
            }
        );
    })
};

module.exports = new PropertyDAO();
