/*
 * Copyright 2017 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
* Main application routes
*/

'use strict';

var config = require('./config/environment');

var csvWriteStream = require('csv-write-stream');
var fs = require('fs');

var path = require('path');
var request = require('request');

var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({
  storage: storage
});

module.exports = function(app) {

    app.get('/config/?', function(req, res) {
        res.status(200).send({
            appVersion: config.appVersion,
            username: req.headers.user ? req.headers.user : 'mockUser',
            elasticConfig: JSON.parse(config.elasticConfig),
            elasticIndex: config.elasticIndex,
            elasticTypes: config.elasticTypes,
            dev: config.dev,
            annotationIndex: config.annotationIndex,
            annotationType: config.annotationType,
            annotationRelevant: config.annotationRelevant,
            annotateOrClassify: config.annotateOrClassify,
            cacheConfig: JSON.parse(config.cacheConfig),
            cacheIndex: config.cacheIndex,
            classificationAuth: config.classificationAuth,
            classificationEntityUrl: config.classificationEntityUrl,
            classificationExtractionUrl: config.classificationExtractionUrl,
            classificationFlagUrl: config.classificationFlagUrl,
            filterStatesIndex: config.filterStatesIndex,
            filterStatesType: config.filterStatesType,
            logIndex: config.logIndex,
            logType: config.logType,
            userIndex: config.userIndex,
            userType: config.userType,
            imageConfig: config.imageConfig ? JSON.parse(config.imageConfig) : undefined,
            imageIndex: config.imageIndex,
            imageType: config.imageType,
            imageServiceAuth: config.imageServiceAuth,
            imageServiceHost: config.imageServiceHost,
            downloadImageUrl: config.downloadImageUrl,
            queryUrl: config.queryUrl,
            rawEsDataUrl: config.rawEsDataUrl
        });
    });

    app.get('/downloadImage/:link', function(req, res) {
      var link = 'https://s3.amazonaws.com/' + decodeURIComponent(req.params.link);
      req.pipe(request(link)).pipe(res);
    });

    app.get('/file/:file', function(req, res) {
      res.download(req.params.file);
    });

    app.post('/export', function(req, res) {
      if(req.body && req.body.length > 1) {
        var filename = req.body[0] + '.csv';
        var header = req.body[1];
        var writer = csvWriteStream({
          headers: header
        });
        writer.pipe(fs.createWriteStream(filename));
        var index = 2;
        writer.on('data', function() {
          index++;
          if(index === req.body.length) {
            writer.end();
            res.status(200).set('Cache-Control', 'no-cache').send('/file/' + filename);
          }
        });
        for(var i = 2; i < req.body.length; ++i) {
          writer.write(req.body[i]);
        }
      } else {
        res.status(200).send();
      }
    });

    app.post('/upload', upload.array('file'), function(req, res) {
      res.status(200).send(req.files[0].buffer.toString());
    });

    app.post('/uploadImage', upload.array('file'), function(req, res) {
        res.status(200).send({mimeType: req.files[0].mimetype, base64: req.files[0].buffer.toString('base64')});
    });

    // All other routes should redirect to the index.html
    app.route('/*').get(function(req, res) {
        res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
