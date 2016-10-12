'use strict';

var nodemailer = require('nodemailer');

module.exports = function Mailer(logger, mailerEmailAddress, digSupportEmailAddress, digUrl) {
  var transporter = nodemailer.createTransport();

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
};

