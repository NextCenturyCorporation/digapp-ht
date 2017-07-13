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

module.exports = {
    env: process.env.NODE_ENV,

    // Root path of server
    root: path.normalize(__dirname + '/../../..'),

    // Server port
    port: process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 9000),

    // Server IP
    ip: process.env.IP || (process.env.NODE_ENV === 'production' ? undefined : '0.0.0.0'),

    appVersion: pjson.version,

    elasticConfig: process.env.ELASTIC_CONFIG || '{"host": "http://localhost:9200"}',
    elasticIndex: process.env.ELASTIC_INDEX || 'dig-data',
    elasticTypes: process.env.ELASTIC_TYPES,
    dev: process.env.DEV || '',
    annotationIndex: process.env.ANNOTATION_INDEX || 'dig-annotations',
    annotationType: process.env.ANNOTATION_TYPE || 'annotation',
    annotationRelevant: process.env.ANNOTATION_RELEVANT || 'to a counter-human-trafficking case',
    classificationAuth: process.env.CLASSIFICATION_AUTH || '{"user": "", "password": ""}',
    classificationEntityUrl: process.env.CLASSIFICATION_ENTITY_URL,
    classificationExtractionUrl: process.env.CLASSIFICATION_EXTRACTION_URL,
    classificationFlagUrl: process.env.CLASSIFICATION_FLAG_URL,
    filterStatesIndex: process.env.FILTER_STATES_INDEX || 'dig-filter-states',
    filterStatesType: process.env.FILTER_STATES_TYPE || 'item',
    imageConfig: process.env.IMAGE_CONFIG,
    imageIndex: process.env.IMAGE_INDEX,
    imageType: process.env.IMAGE_TYPE,
    imageServiceAuth: process.env.IMAGE_SERVICE_AUTH || '{"user": "", "password": ""}',
    imageServiceHost: process.env.IMAGE_SERVICE_HOST || '{"url": "", "base64": ""}',
    cacheConfig: process.env.CACHE_CONFIG || '{"host": "http://localhost:9200"}',
    cacheIndex: process.env.CACHE_INDEX || 'memex-domains',
    logIndex: process.env.LOG_INDEX || 'dig-logs',
    logType: process.env.LOG_TYPE || 'log',
    userIndex: process.env.USER_INDEX || 'dig-users',
    userType: process.env.USER_TYPE || 'user',
    downloadImageUrl: process.env.DOWNLOAD_IMAGE_URL || 'downloadImage',
    queryUrl: process.env.QUERY_URL,
    rawEsDataUrl: process.env.RAW_ES_DATA_URL
};
