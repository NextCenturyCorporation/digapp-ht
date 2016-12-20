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

var Client = require('./client.js');
var Logger = require('./logger.js');
var Mailer = require('./mailer.js');
var Runner = require('./runner.js');
var Scheduler = require('./scheduler.js');

var LOG_NAME = process.env.LOG_NAME || 'DIG Alerts App';
var LOG_PATH = process.env.LOG_PATH || '/var/log/dig_alerts_app.log';

var MAILER_EMAIL_ADDRESS = process.env.MAILER_EMAIL_ADDRESS || 'dig@nextcentury.com';
var DIG_SUPPORT_EMAIL_ADDRESS = process.env.DIG_SUPPORT_EMAIL_ADDRESS;
var DIG_URL = process.env.DIG_URL;

var ES_AUTH = process.env.ES_AUTH || null;
var ES_HOST = process.env.ES_HOST || 'localhost';
var ES_PORT = process.env.ES_PORT || 9200;
var ES_PROTOCOL = process.env.ES_PROTOCOL || 'http';

var USER_INDEX = process.env.USER_INDEX || 'dig-users';
var USER_TYPE = process.env.USER_TYPE || 'user';
var DATA_INDEX = process.env.DATA_INDEX || 'dig-latest';
var DATE_FIELD = process.env.DATE_FIELD || 'dateCreated';

var logger = new Logger(LOG_NAME, LOG_PATH);

logger.info('Logger created.');

//var mailer = new Mailer(logger, MAILER_EMAIL_ADDRESS, DIG_SUPPORT_EMAIL_ADDRESS, DIG_URL);

//logger.info('Mailer created.  Sending a support email...');

//mailer.sendSupportEmail();

var client = new Client(logger, ES_AUTH, ES_HOST, ES_PORT, ES_PROTOCOL);

logger.info('Client created.');

var runner = new Runner(logger, client, USER_INDEX, USER_TYPE, DATA_INDEX, DATE_FIELD, function(a, b, callback) {
  callback();
});

//var runner = new Runner(logger, client, USER_INDEX, USER_TYPE, DATA_INDEX, DATE_FIELD, mailer.sendAlertEmail);

logger.info('Runner created.');

var scheduler = new Scheduler(logger);

logger.info('Scheduler created.  Starting jobs...');

runner.checkUsersDaily();

scheduler.runDaily(runner.checkUsersDaily);
scheduler.runWeekly(runner.checkUsersWeekly);
//scheduler.runDaily(mailer.sendSupportEmail);

