/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var imageTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function getImageUrl(record) {
    return _.get(record, 'url');
  }

  return {
    // expected data is from an elasticsearch
    images: function(data) {
      var images = [];
      if(data) {
        data.hits.hits.forEach(function(hit) {
          images.push(getImageUrl(hit._source));
        });
      }
      return images;
    },
    image: function(data) {
      var newData = {};
      if(data && data.hits.hits.length > 0) {
        newData = data.hits.hits[0]._source;

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

        if(newData.similarImageId.similarImageId) {
          var similarImages = {
            total: newData.similarImageId.similarImageId.length,
            array: newData.similarImageId.similarImageId
          };
          newData.similarImages = similarImages;
        }
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

    imageTotal: function(data) {
      return (data && data.hits) ? data.hits.total : 0;
    }
  };
})(_, relatedEntityTransform, commonTransforms);

