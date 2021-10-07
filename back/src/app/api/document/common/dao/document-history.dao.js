'use strict';

const BaseDAO = require('../../../../core/base.dao');

class DocumentHistoryDAO extends BaseDAO {
    constructor(model) {
        super(model);
    }

    createHistoryRecord(document) {
        return this.create({DocumentID: document._id, document});
    }

    getHistoryRecord(DocumentID) {
        return this.all({DocumentID});
    }
}

module.exports = DocumentHistoryDAO;
