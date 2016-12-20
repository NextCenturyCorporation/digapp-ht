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
 * transform elastic search phone query to display format.  See data-model.json
 */

/* exported phoneTransform */
/* jshint camelcase:false */

var phoneTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    phone: function(data) {
      var phone = {};

      if(data && data.hits.hits.length > 0) {
        phone.id = _.get(data.hits.hits[0], '_source.uri');
        phone.telephoneNumber = _.get(data.hits.hits[0], '_source.name');
        phone.icon = commonTransforms.getIronIcon('phone');
        phone.styleClass = commonTransforms.getStyleClass('phone');
      }

      return phone;
    },

    cleanPhoneBuckets: function(buckets) {
      return _.map(buckets, function(bucket) {
        var text = bucket.key.substring(bucket.key.lastIndexOf('/') + 1);
        if(text.indexOf('-') >= 0) {
          text = text.substring(text.indexOf('-') + 1);
        }
        return {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          doc_count: bucket.doc_count,
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          key: bucket.key,
          text: text
        };
      });
    }
  };
});

