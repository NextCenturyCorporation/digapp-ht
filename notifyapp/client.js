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

var Elasticsearch = require('elasticsearch');

module.exports = function Client(logger, auth, host, port, protocol) {
  var client = new Elasticsearch.Client({
    host: {
      auth: auth,
      host: host,
      port: port,
      protocol: protocol
    },
    log: function() {
      return logger;
    }
  }); 

  client.ping({
    requestTimeout: 30000,
    hello: 'elasticsearch!'    
  }).then(function() {
    logger.info('Elasticsearch connected.');
  }, function(error) {
    logger.error(error.message, 'Elasticsearch not connected!');
  });

  return client;
};

