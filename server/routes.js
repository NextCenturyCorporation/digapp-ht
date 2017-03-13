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

var errors = require('./components/errors');
var config = require('./config/environment');
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
            elasticConfig: JSON.parse(config.elasticConfig),
            elasticIndex: config.elasticIndex,
            elasticTypes: config.elasticTypes,
            appVersion: config.appVersion,
            annotationIndex: config.annotationIndex,
            annotationType: config.annotationType,
            annotationRelevant: config.annotationRelevant,
            cacheConfig: JSON.parse(config.cacheConfig),
            cacheIndex: config.cacheIndex,
            username: req.headers.user ? req.headers.user : 'mockUser',
            filterStatesIndex: config.filterStatesIndex,
            filterStatesType: config.filterStatesType,
            logIndex: config.logIndex,
            logType: config.logType,
            userIndex: config.userIndex,
            userType: config.userType,
            imageServiceAuth: config.imageServiceAuth,
            imageServiceHost: config.imageServiceHost,
            downloadImageUrl: config.downloadImageUrl,
            queryUrl: config.queryUrl
        });
    });

    app.get('/downloadImage/:link', function(req, res) {
      var link = 'https://s3.amazonaws.com/' + decodeURIComponent(req.params.link);
      req.pipe(request(link)).pipe(res);
    });

    app.post('/upload', upload.array('file'), function(req, res) {
      res.status(200).send(req.files[0].buffer.toString());
    });

    app.post('/uploadImage', upload.array('file'), function(req, res) {
        res.status(200).send({mimeType: req.files[0].mimetype, base64: req.files[0].buffer.toString('base64')});
    });

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*').get(function(req, res) {
        res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
