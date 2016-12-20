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

/**
 * transform elastic search filter aggregations to display format.
 */

/* exported filterAggTransform */
/* jshint camelcase:false */

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
});
