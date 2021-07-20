'use strict';

const InternalInventoryController = require("../controller/internal-inventory.controller");

const INTERNAL_INVENTORY_ROUTES = [
    {method: 'GET', path: '/inventory', config: InternalInventoryController.all},
    {method: 'GET', path: '/inventory/{InventoryID}', config: InternalInventoryController.get},
    {method: 'POST', path: '/inventory', config: InternalInventoryController.create},
    {method: 'POST', path: '/inventory/{InventoryID}', config: InternalInventoryController.update},
    {method: 'POST', path: '/inventory/batch', config: InternalInventoryController.batch},
];

module.exports = INTERNAL_INVENTORY_ROUTES;
