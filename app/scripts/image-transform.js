/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _ */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope. */
var imageTransform = (function(_) {

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

    imageTotal: function(data) {
      return (data && data.hits) ? data.hits.total : 0;
    }
  };
})(_);
