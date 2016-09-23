/**
 * transform elastic search filter aggregations to display format.
 */

/* globals _ */
/* exported filterAggTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var filterAggTransform = (function(_) {
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
    }
  };
})(_);
