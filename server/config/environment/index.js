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
    filterStatesIndex: process.env.FILTER_STATES_INDEX || 'dig-filter-states',
    filterStatesType: process.env.FILTER_STATES_TYPE || 'item',
    imageServiceAuth: process.env.IMAGE_SERVICE_AUTH|| '{"user": "", "password":""}',
    imageServiceHost: process.env.IMAGE_SERVICE_HOST|| '{"url":"","base64":""}',
    annotationRelevant: process.env.ANNOTATION_RELEVANT || 'to a counter-human-trafficking case',
    cacheConfig: process.env.CACHE_CONFIG || '{"host": "http://localhost:9200"}',
    cacheIndex: process.env.CACHE_INDEX || 'memex-domains',
    logIndex: process.env.LOG_INDEX || 'dig-logs',
    logType: process.env.LOG_TYPE || 'log',
    userIndex: process.env.USER_INDEX || 'dig-users',
    userType: process.env.USER_TYPE || 'user',
    downloadImageUrl: process.env.DOWNLOAD_IMAGE_URL || 'downloadImage',
    queryUrl: process.env.QUERY_URL
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
    all,
    require('./' + process.env.NODE_ENV + '.js') || {});
