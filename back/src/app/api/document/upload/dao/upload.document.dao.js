'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');

const logger = require("../../../../core/logger");
const fileDirPath = path.normalize(__dirname + '/../public/file');

class UploadDocumentDAO {
    deleteFile(filePath) {
        const propertyFilePath = path.normalize(`${fileDirPath}/${filePath}`);
        if (fs.existsSync(propertyFilePath)) {
            fs.unlinkSync(propertyFilePath)
        }
    }

    async getFileListForProperty(PropertyID) {
        const propertyFilesPath = path.normalize(`${fileDirPath}/${PropertyID}`);

        if (!fs.existsSync(propertyFilesPath)) {
            return [];
        }

        const files = await getFilesListFromPath(propertyFilesPath);
        const list = await Promise.map(files, async filename => {
            const stats = await getFileStat(propertyFilesPath, filename);
            return {
                filename,
                PropertyID,
                updated_at: stats['mtime'],
                created_at: stats['ctime'],
                type: 'upload'
            }
        });

        return list;
    }
}

async function getFileStat(dirPath, filename) {
    const filePath = path.normalize(`${dirPath}/${filename}`);
    return new Promise((resolve, reject) => fs.stat(filePath, (err, stats) => err ? reject(err) : resolve(stats)));
}

async function getFilesListFromPath(dirPath) {
    return new Promise((resolve, reject) => fs.readdir(dirPath, (err, files) => err ? reject(err) : resolve(files)));
}

module.exports = new UploadDocumentDAO();
