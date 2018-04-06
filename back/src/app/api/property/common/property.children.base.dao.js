'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');
const BaseDAO = require('../../../core/base.dao');

class PropertyChildrenBaseDAO extends BaseDAO {
    constructor(model) {
        super(model);
    }

    forProperty(PropertyID){
        return this.model.find({PropertyID});
    }
}

module.exports = PropertyChildrenBaseDAO;
