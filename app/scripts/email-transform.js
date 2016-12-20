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
 * transform elastic search email query to display format.  See data-model.json
 */

/* exported emailTransform */
/* jshint camelcase:false */

var emailTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    email: function(data) {
      var email = {};

      if(data && data.hits.hits.length > 0) {
        email.id = _.get(data.hits.hits[0], '_source.uri');
        email.emailAddress = decodeURIComponent(_.get(data.hits.hits[0], '_source.name'));
        email.icon = commonTransforms.getIronIcon('email');
        email.styleClass = commonTransforms.getStyleClass('email');
      }

      return email;
    },

    cleanEmailBuckets: function(buckets) {
      return _.map(buckets, function(bucket) {
        return {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          doc_count: bucket.doc_count,
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          key: bucket.key,
          text: decodeURIComponent(bucket.key.substring(bucket.key.lastIndexOf('/') + 1))
        };
      });
    }
  };
});
