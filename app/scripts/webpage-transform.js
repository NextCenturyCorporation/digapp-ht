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
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* exported webpageTransform */
/* jshint camelcase:false */

var webpageTransform = (function(_, commonTransforms, offerTransform) {
  return {
    // expected data is from an elasticsearch
    webpages: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var webpageObject = offerTransform.offerFromRecordAndPaths(record, '_source', '_source.mainEntity.uri', '_source.dateCreated', '_source.mainEntity');
          webpageObject.highlightedText = _.get(record, 'highlight.name[0]') || null;
          if(webpageObject.details) {
            webpageObject.details[1].highlightedText = _.get(record, 'highlight.description[0]') || null;
          }
          newObj.data.push(webpageObject);
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },

    webpageRevisions: function(data) {
      if(data && data.aggregations) {
        var total = 0;
        var revisions = _.map(data.aggregations.revisions.revisions.buckets, function(bucket) {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          total += bucket.doc_count;
          return {
            date: commonTransforms.getDate(bucket.key_as_string),
            icon: commonTransforms.getIronIcon('date'),
            styleClass: commonTransforms.getStyleClass('date'),
            count: bucket.doc_count
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
        return (total < 2 ? [] : revisions);
      }
      return [];
    }
  };
});
