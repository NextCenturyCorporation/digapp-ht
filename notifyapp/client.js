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

