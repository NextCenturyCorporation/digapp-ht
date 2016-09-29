'use strict';

var Schedule = require('node-schedule');

module.exports = function Scheduler(logger) {
  this.runMinutely = function(callback) {
    Schedule.scheduleJob('*/1 * * * *', callback);
  };

  this.runHourly = function(callback) {
    Schedule.scheduleJob('0 * * * *', callback);
  };

  this.runDaily = function(callback) {
    Schedule.scheduleJob('0 0 * * *', callback);
  };

  this.runWeekly = function(callback) {
    Schedule.scheduleJob('0 0 * * 0', callback);
  };
};
