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
    images: function(data) {
      var images = [];
      if(data && data.aggregations && data.aggregations.image && data.aggregations.image.image && data.aggregations.image.image.buckets) {
        data.aggregations.image.image.buckets.forEach(function(bucket) {
          images.push({
            icon: commonTransforms.getIronIcon('image'),
            link: commonTransforms.getLink(bucket.key, 'image'),
            source: bucket.key,
            styleClass: commonTransforms.getStyleClass('image')
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
