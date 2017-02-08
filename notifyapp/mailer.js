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

var nodemailer = require('nodemailer');

module.exports = function Mailer(logger, mailerEmailAddress, digSupportEmailAddress, digUrl, smtp) {
  var transporter;

  if(smtp && smtp.host && smtp.port && smtp.user && smtp.pass) {
    logger.info('Creating nodemailer SMTP transporter at ' + smtp.host + ':' + smtp.port + ' with username ' + smtp.user);
    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: true,
      logger: logger,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      }
    });
  } else {
    logger.info('No SMTP config.  Creating default nodemailer transporter.');
    transporter = nodemailer.createTransport();
  }

  this.sendAlertEmail = function(toEmailAddress, savedQueryNames, callback) {
    transporter.sendMail({
      from: mailerEmailAddress,
      to: toEmailAddress,
      subject: 'DIG Alert on ' + (savedQueryNames.length === 1 ? savedQueryNames[0] : savedQueryNames.length + ' of Your Saved Queries'),
      text: 'DIG has new results available for your following saved queries:\n\n' + savedQueryNames.join('\n') +
        (digUrl ? ('\n\nRun your queries in the DIG application here:  ' + digUrl) : '') +
        '\n\nThanks!\n'
    }, function(error, info) {
      if(error) {
        logger.error(error, 'Error sending alert email to ' + toEmailAddress);
      } else {
        logger.info('Sent alert email for ' + savedQueryNames.length + ' saved queries to ' + toEmailAddress);
      }
      callback();
    });
  };

  this.sendSupportEmail = function() {
    if(!digSupportEmailAddress) {
      logger.info('Cannot send support email because address is not specified.');
      return;
    }

    transporter.sendMail({
      from: mailerEmailAddress,
      to: digSupportEmailAddress,
      subject: 'DIG Alert App Status',
      text: 'The DIG Alert App is running as of ' + new Date().toUTCString()
    }, function(error, info) {
      if(error) {
        logger.error(error, 'Error sending support email to ' + digSupportEmailAddress);
      } else {
        logger.info('Sent support email.');
      }
    });
  };

  logger.info('Mailer created.');
  logger.info('Mailer email address:  ' + mailerEmailAddress);
  logger.info('DIG support email address:  ' + digSupportEmailAddress);
  logger.info('DIG URL:  ' + digUrl);
};

