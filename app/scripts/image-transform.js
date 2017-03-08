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
 * transform elastic search image query to display format.  See data-model.json
 */

/* exported imageTransform */
/* jshint camelcase:false */

var imageTransform = (function(_, commonTransforms) {
  return {
    image: function(data) {
      if(data && data.hits && data.hits.hits && data.hits.hits.length) {
        return {
          id: data.hits.hits[0]._source.identifier,
          ads: (data.hits.hits[0]._source.isImagePartOf || []).map(function(item) {
            return item.uri;
          }).slice(0, 10000),
          url: data.hits.hits[0]._source.url
        };
      }
      return {};
    },

    images: function(data) {
      var images = [];
      if(data && data.aggregations && data.aggregations.image && data.aggregations.image.image && data.aggregations.image.image.buckets) {
        data.aggregations.image.image.buckets.forEach(function(bucket) {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          var count = bucket.doc_count;
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          images.push({
            count: count,
            //icon: commonTransforms.getIronIcon('image'),
            link: commonTransforms.getLink(bucket.key, 'image'),
            source: bucket.key,
            styleClass: commonTransforms.getStyleClass('image'),
            text: ''
          });
        });
      }
      return images;
    },

    externalImageLink: function(id) {
      return commonTransforms.getLink(id, 'image');
    }
  };
});
