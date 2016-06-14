/**
* Main application routes
*/

'use strict';

var errors = require('./components/errors'),
config = require('./config/environment'),
path = require('path');

module.exports = function(app) {


    app.get('/config/?', function(req, res) {
        res.status(200).send({
            elasticConfig: JSON.parse(config.elasticConfig),
            elasticIndex: config.elasticIndex,
            elasticTypes: config.elasticTypes,
            appVersion: config.appVersion,
            queryTemplates: config.queryTemplates,
            annotationIndex: config.annotationIndex,
            annotationType: config.annotationType
        });
    });

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

    // All other routes should redirect to the index.html
    app.route('/*').get(function(req, res) {
        res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
