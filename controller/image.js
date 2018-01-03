/**
 * Created by Zeus on 09/03/16.
 */
'use strict';

var Joi = require('joi');
var Boom = require('boom');

exports.save = {
    handler: function (request, reply) {
        var Photo = request.payload.Photo;
        var uuid = require("node-uuid");
        var filename = uuid.v4();
        //console.log(filename+":"+Photo.length);

        var Fs = require("fs");

        Fs.writeFile("./img/"+filename+".jpg", Photo, function(err) {
            if(err){
                console.log("E:"+err);
            }
        });

        var easyimg = require('easyimage');
        //var Enlarge = easyimg.thumbnail({src:"./img/temp-"+filename+".jpg", dst:"./img/"+filename+".jpg",width:768,height:1024});
        var Thumbnail = easyimg.thumbnail({src:"./img/"+filename+".jpg", dst:"./img/"+filename+"-t.jpg",width:250,height:250,quality:100});
        //Fs.unlink("./img/temp-"+filename+".jpg");

        return reply(filename+".jpg");
    },payload: {
        maxBytes: 100000000,
        timeout: 11000000
    },
    timeout: {
        socket: 12000000
    }
};