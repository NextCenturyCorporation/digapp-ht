'use strict';

/*
 * The purpose of this module for executing Saved Scheduled Queries (SSQ) 
 * to determine whether to set a notification.
 */

module.exports = function(logger, client, userIndex, userType, dataIndex, dateField, sendAlertEmailCallback) {

  var createSavedQueryBody = function(savedQuery) {
    var savedQueryBody = {
      query: JSON.parse(savedQuery.esState.query),
      size: 1,
      sort: {}
    };
    if(savedQuery.filter) {
      savedQuery.filter = JSON.parse(savedQuery.esState.filter);
    }
    savedQueryBody.sort[dateField] = {
      order: 'desc'
    };
    return savedQueryBody;
  };

  var checkAndSaveAlert = function(savedQuery, results) {
    if(results.hits.hits.length) {
      // Check the date of the newest item and compare it with the date on which the saved query was last run.
      var resultDate = new Date(results.hits.hits[0]._source[dateField]);
      var lastDate = new Date(savedQuery.lastRunDate);
      if(resultDate.getTime() > lastDate.getTime()) {
        // Update the notification date so the app knows to show an alert.
        savedQuery.notificationHasRun = false;
        savedQuery.notificationDate = new Date();
      }
    }
    return savedQuery;
  };

  var updateUser = function(user, savedQueries, callback) {
    // Update the saved queries for the user in the database.
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
      // Add the saved query to the updated query list.  Then check the next saved query.
      updatedQueries.push(savedQuery);
      checkNextQuery(savedQueries.slice(1), updatedQueries, callback);
    };

    var savedQuery = savedQueries[0];

    // Check if we need to run the saved query.
    if(savedQuery.sendEmailNotification) {
      client.search({
        index: dataIndex,
        type: ['webpage'],
        body: createSavedQueryBody(savedQuery)
      }).then(function(results) {
        // Check the results of the saved query for new items.
        done(checkAndSaveAlert(savedQuery, results));
      }, function(error) {
        logger.error(error, 'Error running saved query');
        done(savedQuery);
      });
    } else {
      done(savedQuery);
    }
  };

  var sendAlertEmailIfNeeded = function(user, updatedQueries, callback) {
    var savedQueryNames = updatedQueries.filter(function(query) {
      return query.sendEmailNotification && (query.notificationHasRun === false);
    }).map(function(query) {
      return query.name;
    });
    if(sendAlertEmailCallback && user._source.emailAddress && savedQueryNames.length) {
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
      // Send an alert email to the user if needed.  Then check the saved queries for the next user.
      sendAlertEmailIfNeeded(users[0], updatedQueries || [], function() {
        checkAndSaveNextUser(users.slice(1), period);
      });
    };

    var user = users[0];

    // Check if we need to run the saved queries for the user.
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
      // Get the list of all users.
      client.search({
        index: userIndex,
        type: userType,
        body: {}
      }).then(function(users) {
        logger.info('Checking ' + users.hits.hits.length + ' users for period ' + period);
        checkAndSaveNextUser(users.hits.hits, period);
        logger.info('Done checking ' + users.hits.hits.length + ' users for period ' + period);
      }, function(error) {
        logger.error(error, 'Error getting users');
      });
    };
  };

  return {
    checkUsersDaily: checkUsers('daily'),
    checkUsersWeekly: checkUsers('weekly')
  };
};
