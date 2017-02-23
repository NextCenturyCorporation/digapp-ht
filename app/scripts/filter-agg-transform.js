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

var filterAggTransform = (function() {
  function cityIdToText(id) {
    var idPartList = id.split(':');
    return (idPartList.length > 1 ? idPartList[0] + ', ' + idPartList[1] : '');
  }

  return {
    cities: function(data) {
      var buckets = [];
      if(data && data.aggregations && data.aggregations.city && data.aggregations.city.city.buckets) {
        buckets = data.aggregations.city.city.buckets.map(function(bucket) {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          return {
            doc_count: bucket.doc_count,
            key: bucket.key,
            text: cityIdToText(bucket.key)
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
      }

      return {
        aggregations: {
          city: {
            city: {
              buckets: buckets
            }
          }
        }
      };
    },

    cityIdToText: function(id) {
      return cityIdToText(id);
    }
  };
});
