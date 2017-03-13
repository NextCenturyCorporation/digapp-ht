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

var filterAggTransform = (function(_, commonTransforms) {
  return {
    cityList: function(data, property) {
      if(data && data.aggregations && data.aggregations[property] && data.aggregations[property][property] && data.aggregations[property][property].buckets) {
        return data.aggregations[property][property].buckets.map(function(bucket) {
          var city = commonTransforms.getLocationDataFromId(bucket.key).city;
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          return {
            count: bucket.doc_count,
            id: city,
            text: city
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        }).filter(function(city) {
          return city.text;
        });
      }
      return [];
    },

    filterList: function(data, property) {
      if(data && data.aggregations && data.aggregations[property] && data.aggregations[property][property] && data.aggregations[property][property].buckets) {
        return data.aggregations[property][property].buckets.map(function(bucket) {
          var id = ('' + bucket.key).toLowerCase();
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          return {
            count: bucket.doc_count,
            id: id
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
      }
      return [];
    },

    socialMediaList: function(data, property) {
      if(data && data.aggregations && data.aggregations[property] && data.aggregations[property][property] && data.aggregations[property][property].buckets) {
        return data.aggregations[property][property].buckets.map(function(bucket) {
          var id = ('' + bucket.key).toLowerCase();

          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          return {
            count: bucket.doc_count,
            id: id.substring(id.indexOf(' ') + 1, id.length),
            text: id
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
      }
      return [];
    },

    phoneList: function(data, property) {
      if(data && data.aggregations && data.aggregations[property] && data.aggregations[property][property] && data.aggregations[property][property].buckets) {
        return data.aggregations[property][property].buckets.map(function(bucket) {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          return {
            count: bucket.doc_count,
            id: bucket.key,
            text: commonTransforms.getFormattedPhone(bucket.key)
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
      }
      return [];
    },

    cityIdToText: function(id) {
      return commonTransforms.getLocationDataFromId(id).text || '';
    }
  };
});
