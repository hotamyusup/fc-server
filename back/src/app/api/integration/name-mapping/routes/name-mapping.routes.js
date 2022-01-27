'use strict';

const NameMappingController = require("../controller/name-mapping.controller");

const NAME_MAPPING_ROUTES = [
    {method: 'GET', path: '/integration/name-mapping', config: NameMappingController.all},
    {method: 'GET', path: '/integration/name-mapping/{NameMappingID}', config: NameMappingController.get},
    {method: 'POST', path: '/integration/name-mapping', config: NameMappingController.create},
    {method: 'POST', path: '/integration/name-mapping/{NameMappingID}', config: NameMappingController.update},
    {method: 'POST', path: '/integration/name-mapping/batch', config: NameMappingController.batch},
    {method: 'POST', path: '/integration/name-mapping/delete', config: NameMappingController.deleteBatch},
];

module.exports = NAME_MAPPING_ROUTES;
