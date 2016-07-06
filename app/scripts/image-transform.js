/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _ */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope. */
var imageTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function getImageUrl(record) {
    return _.get(record, 'url');
  }

  return {
    // expected data is from an elasticsearch
    images: function(data) {
      var images = {
        total: data.hits.total,
        array: []
      };
      data.hits.hits.forEach(function(hit) {
        images.array.push(getImageUrl(hit._source));
      });
      return images;
    },
    image: function(data) {
      var newData = {};
      if(data.hits.hits.length > 0) {
        newData = data.hits.hits[0]._source;

        var adultService = {
          total: newData.isImagePartOf.length,
          array: []
        };

        newData.isImagePartOf.forEach(function(service) {
          adultService.array.push(service.mainEntity.itemOffered.uri);
        });
        newData.adultService = adultService;
      }
      return newData;
    },
    offerLocationData: function(data) {
      return commonTransforms.offerLocationData(data);
    },
    imageOffersData: function(data) {
      var newData = {};
      newData.relatedOffers = relatedEntityTransform.offer(data); 
      return newData;
    },
  };
})(_, relatedEntityTransform, commonTransforms);
