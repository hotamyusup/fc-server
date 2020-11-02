'use strict';

const GeocoderController = require("../controller/geocoder.controller");

const NOTIFICATION_ROUTES = [
    {method: 'GET', path: '/geocoder/geocode/{searchString}', config: GeocoderController.geocode},
    {method: 'POST', path: '/geocoder/geocode', config: GeocoderController.geocodeObject},
];

module.exports = NOTIFICATION_ROUTES;
