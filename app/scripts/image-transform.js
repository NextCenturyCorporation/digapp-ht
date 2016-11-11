/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should commonTransforms */
var imageTransform = (function(_, commonTransforms) {

  return {
    // expected data is from an elasticsearch
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

    imageTotal: function(data) {
      return (data && data.hits) ? data.hits.total : 0;
    },

    externalImageLink: function(id) {
      return commonTransforms.getLink('http://dig.isi.edu/ht/data/' + id, 'image');
    }
  };
})(_, commonTransforms);

