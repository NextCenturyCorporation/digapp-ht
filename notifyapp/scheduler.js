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

var Schedule = require('node-schedule');

module.exports = function Scheduler(logger) {
  this.runMinutely = function(callback) {
    logger.info('Starting minutely job...');
    Schedule.scheduleJob('*/1 * * * *', callback);
  };

  this.runHourly = function(callback) {
    logger.info('Starting hourly job...');
    Schedule.scheduleJob('0 * * * *', callback);
  };

  this.runDaily = function(callback) {
    logger.info('Starting daily job...');
    // Set the hour to noon (GMT) to run after the daily data update.
    Schedule.scheduleJob('0 12 * * *', callback);
  };

  this.runWeekly = function(callback) {
    logger.info('Starting weekly job...');
    // Set the hour to noon (GMT) to run after the daily data update.
    Schedule.scheduleJob('0 12 * * 0', callback);
  };

  logger.info('Scheduler created.');
};
