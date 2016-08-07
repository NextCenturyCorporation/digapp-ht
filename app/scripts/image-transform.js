/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var imageTransform = (function(_, relatedEntityTransform, commonTransforms) {

  return {
    // expected data is from an elasticsearch
    images: function(data) {
      var images = [];
      if(data) {
        data.hits.hits.forEach(function(hit) {
          images.push({
            id: _.get(hit._source, 'uri'),
            source: _.get(hit._source, 'url')
          });
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

        if(newData.similarImageId && newData.similarImageId.similarImageId) {
          newData.similarImageId.similarImageId = _.isArray(newData.similarImageId.similarImageId) ? newData.similarImageId.similarImageId : [newData.similarImageId.similarImageId];
          newData.similarImages = {
            total: newData.similarImageId.similarImageId.length,
            array: newData.similarImageId.similarImageId
          };
        }
      }
      newData._id = newData.uri;
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

