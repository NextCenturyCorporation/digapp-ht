'use strict';

var Bunyan = require('bunyan');

module.exports = function Logger(loggerName, loggerPath) {
  var logger = Bunyan.createLogger({
    name: loggerName,
    streams: [{
      count: 10,
      path: loggerPath,
      period: '1d',
      type: 'rotating-file'
    }]
  });

  this.error = logger.error.bind(logger);
  this.warning = logger.warn.bind(logger);
  this.info = logger.info.bind(logger);
  this.debug = logger.debug.bind(logger);
  this.trace = function(method, requestUrl, body, responseBody, responseStatus) {
    logger.trace({
      method: method,
      requestUrl: requestUrl,
      body: body,
      responseBody: responseBody,
      responseStatus: responseStatus
    });
  };
  this.close = function () { /* bunyan's loggers do not need to be closed */ };
};

