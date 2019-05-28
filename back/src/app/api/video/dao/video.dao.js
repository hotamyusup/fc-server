'use strict';

const BaseDAO = require("../../../core/base.dao");
const VideoModel = require("../model/video.model");

const VideoDao = new BaseDAO(VideoModel);
module.exports = VideoDao;
