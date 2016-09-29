'use strict';

/*
 * The purpose of this module for executing Saved Scheduled Queries (SSQ) 
 * to determine whether to set a notification.
 */

module.exports = function(logger, client, userIndex, userType, dataIndex, dateField, sendAlertEmailCallback) {

  var createSavedQueryBody = function(savedQuery) {
    var savedQueryBody = {
      filter: JSON.parse(savedQuery.esState.filter),
      query: JSON.parse(savedQuery.esState.query),
      size: 1,
      sort: {}
    };
    savedQueryBody.sort[dateField] = {
      order: 'desc'
    };
    return savedQueryBody;
  };

  var checkAndSaveAlert = function(savedQuery, results) {
    if(results.hits.hits.length) {
      var resultDate = new Date(results.hits.hits[0]._source[dateField]);
      var lastDate = new Date(savedQuery.lastRunDate);
      if(resultDate.getTime() > lastDate.getTime()) {
        savedQuery.notificationHasRun = true;
        savedQuery.notificationDate = new Date();
      }
    }
    return savedQuery;
  };

  var updateUser = function(user, savedQueries, callback) {
    client.update({
      index: userIndex,
      type: userType,
      id: user._id,
      body: {
        doc: {
          savedQueries: savedQueries
        }
      }
    }, function(error, response) {
      if(error) {
        logger.error(error, 'Error updating user ' + user._id);
      }
      callback(savedQueries);
    });
  };

  var checkNextQuery = function(savedQueries, updatedQueries, callback) {
    if(!savedQueries.length) {
      callback(updatedQueries);
      return;
    }

    var done = function(savedQuery) {
      updatedQueries.push(savedQuery);
      checkNextQuery(savedQueries.slice(1), updatedQueries, callback);
    };

    var savedQuery = savedQueries[0];
    logger.info('Checking alert for search named ' + savedQuery.name + ':  ' + savedQuery.sendEmailNotification + ' number ' + updatedQueries.length);

    if(savedQuery.sendEmailNotification) {
      client.search({
        index: dataIndex,
        body: createSavedQueryBody(savedQuery)
      }).then(function(results) {
        logger.info('Got results for search named ' + savedQuery.name);
        done(checkAndSaveAlert(savedQuery, results));
      }, function(error) {
        logger.error(error, 'Error running saved query');
        done(savedQuery);
      });
    } else {
      logger.info('Skipping search named ' + savedQuery.name);
      done(savedQuery);
    }
  };

  var sendAlertEmailIfNeeded = function(user, updatedQueries, callback) {
    var savedQueryNames = updatedQueries.filter(function(query) {
      return query.notificationHasRun;
    }).map(function(query) {
      return query.name;
    });
    if(sendAlertEmailCallback && savedQueryNames.length) {
      sendAlertEmailCallback(user._source.emailAddress, savedQueryNames, function(error, response) {
        if(error) {
          logger.error(error);
        }
        callback();
      });
    } else {
      callback();
    }
  };

  var checkAndSaveNextUser = function(users, period) {
    if(!users.length) {
      return;
    }

    var done = function(updatedQueries) {
      sendAlertEmailIfNeeded(users[0], updatedQueries || [], function() {
        checkAndSaveNextUser(users.slice(1), period);
      });
    };

    var user = users[0];
    logger.info('Checking freq against ' + period + ':  ' + user._source.notificationFrequency + ' for user ' + user._source.username);

    if(user._source.notificationFrequency === period) {
      checkNextQuery(user._source.savedQueries, [], function(updatedQueries) {
        updateUser(user, updatedQueries, done);
      });
    } else {
      done();
    }
  };

  var checkUsers = function(period) {
    return function() {
      client.search({
        index: userIndex,
        type: userType,
        body: {}
      }).then(function(users) {
        checkAndSaveNextUser(users.hits.hits, period);
      }, function(error) {
        logger.error(error, 'Error getting users');
      });
    };
  };

  return {
    checkUsersHourly: checkUsers('hourly'),
    checkUsersDaily: checkUsers('daily'),
    checkUsersWeekly: checkUsers('weekly')
  };
};
