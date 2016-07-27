/**
 * transform elastic search filter aggregations to display format.
 */

/* globals _ */
/* exported filterAggTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var filterAggTransform = (function(_) {

  function getNameFromUri(uri, type) {
    var idx = uri.lastIndexOf('/');
    var text = uri.substring(idx + 1);
    var countryCode = '';
    if(type === 'phone') {
      if(text.indexOf('-') !== -1) {
        var idx2 = text.indexOf('-');
        text = text.substring(idx2 + 1);
        var cc = text.substring(0,idx2);
        if(cc.length < 5) {
          countryCode = cc;
        }
      }
    }
    return text;
  }

  return {
    cityResults: function(data) {
      var cityResultsObj = {};

      if(data && data.aggregations && data.aggregations.cityAgg &&
          data.aggregations.cityAgg.cityAgg.buckets) {

        cityResultsObj.aggregations = {cityAgg: {cityAgg: {buckets: []}}};

        _.each(data.aggregations.cityAgg.cityAgg.buckets, function(record) {
          var newObj = {};
          newObj.key = record.key;
          var keys = record.key.split(':');
          newObj.text = keys[0] + ', ' + keys[1];
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          newObj.doc_count = record.doc_count;
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

          cityResultsObj.aggregations.cityAgg.cityAgg.buckets.push(newObj);
        });
      }
      return cityResultsObj;
    },
    mentionsPhoneResults: function(data, limit) {
      var phoneResultsObj = {};
      if(data && data.aggregations && data.aggregations.phoneEmailAgg &&
          data.aggregations.phoneEmailAgg.phoneEmailAgg.buckets) {

        phoneResultsObj = {aggregations: {phoneAgg: {phoneAgg: {buckets: []}}}};

        _.each(data.aggregations.phoneEmailAgg.phoneEmailAgg.buckets, function(record) {
          if(record.key.indexOf('phone') !== -1) {
            var newObj = {};
            newObj.key = record.key;
            newObj.text = getNameFromUri(record.key, 'phone');
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            newObj.doc_count = record.doc_count;
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
            phoneResultsObj.aggregations.phoneAgg.phoneAgg.buckets.push(newObj);

            // since phoneEmailAgg returns all buckets, return only up to the limit
            // specified
            if(phoneResultsObj.aggregations.phoneAgg.phoneAgg.buckets.length === limit) {
              return false;
            }
          }
        });
      }
      return phoneResultsObj;
    },
    mentionsEmailResults: function(data, limit) {
      var emailResultsObj = {};
      if(data && data.aggregations && data.aggregations.phoneEmailAgg &&
          data.aggregations.phoneEmailAgg.phoneEmailAgg.buckets) {

        emailResultsObj = {aggregations: {emailAgg: {emailAgg: {buckets: []}}}};

        _.each(data.aggregations.phoneEmailAgg.phoneEmailAgg.buckets, function(record) {
          if(record.key.indexOf('email') !== -1) {
            var newObj = {};
            newObj.key = record.key;
            newObj.text = decodeURIComponent(getNameFromUri(record.key, 'email'));
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            newObj.doc_count = record.doc_count;
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
            emailResultsObj.aggregations.emailAgg.emailAgg.buckets.push(newObj);

            // since phoneEmailAgg returns all buckets, return only up to the limit
            // specified
            if(emailResultsObj.aggregations.emailAgg.emailAgg.buckets.length === limit) {
              return false;
            }
          }
        });
      }
      return emailResultsObj;
    }
  };
})(_);
