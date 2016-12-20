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
    // expected data is from an elasticsearch
    image: function(data) {
      var newData = {};
      if(data && data.hits.hits.length > 0) {
        newData = data.hits.hits[0]._source;
        newData.url = _.isArray(newData.url) ? newData.url[0] : newData.url;

        var adultService = {
          total: newData.isImagePartOf.length,
          array: []
        };

        newData.isImagePartOf = _.isArray(newData.isImagePartOf) ? newData.isImagePartOf : [newData.isImagePartOf];
        newData.isImagePartOf.forEach(function(service) {
          if(service.mainEntity) {
            adultService.array.push(service.mainEntity.itemOffered.uri);
          }
        });

        newData.adultService = adultService;
      }
      newData.id = newData.uri;
      return newData;
    },

    images: function(data) {
      var images = [];
      if(data) {
        data.hits.hits.forEach(function(hit) {
          var imageId = _.get(hit._source, 'uri', '');
          var imageSource = _.get(hit._source, 'url', '');
          images.push({
            id: imageId,
            icon: commonTransforms.getIronIcon('image'),
            link: commonTransforms.getLink(imageId, 'image'),
            source: _.isArray(imageSource) ? imageSource[0] : imageSource,
            styleClass: commonTransforms.getStyleClass('image')
          });
        });
      }
      return images;
    },

    imageTotal: function(data) {
      return (data && data.hits) ? data.hits.total : 0;
    },

    externalImageLink: function(id) {
      return commonTransforms.getLink('http://dig.isi.edu/ht/data/' + id, 'image');
    }
  };
});
