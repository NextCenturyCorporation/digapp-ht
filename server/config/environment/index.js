'use strict';

var path = require('path');
var _ = require('lodash');
var pjson = require('../../../package.json');
var elasticTypes = require('../elastic-types.js');

function requiredProcessEnv(name) {
    if(!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || 9000,

    // Server IP
    ip: process.env.IP || '0.0.0.0',

    // Should we populate the DB with sample data?
    seedDB: false,

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'digentity-graph-secret'
    },

    // List of user roles
    userRoles: ['guest', 'user', 'admin'],

    appVersion: pjson.version,

    elasticConfig: process.env.ELASTIC_CONFIG || '{"host": "http://localhost:9200"}',
    elasticIndex: process.env.ELASTIC_INDEX || 'mockads',
    elasticTypes: elasticTypes.TYPE_MAP_ARRAY,
    annotationIndex: process.env.ANNOTATION_INDEX || 'dig-annotations',
    annotationType: process.env.ANNOTATION_TYPE || 'annotation',
    imageServiceAuth: process.env.IMAGE_SERVICE_AUTH|| '{"user": "", "password":""}',
    imageServiceHost: process.env.IMAGE_SERVICE_HOST|| '{"url":"","base64":""}',
    annotationRelevant: process.env.ANNOTATION_RELEVANT || 'to a counter-human-trafficking case',
    cacheConfig: process.env.CACHE_CONFIG || '{"host": "http://localhost:9200"}',
    cacheIndex: process.env.CACHE_INDEX || 'memex-domains',
    userIndex: process.env.USER_INDEX || 'dig-users',
    userType: process.env.USER_TYPE || 'user'
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});
