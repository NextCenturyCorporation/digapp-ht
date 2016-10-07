/* globals _ */
/* exported cacheTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var cacheTransform = (function(_) {
  return {
    ad: function(data) {
      if(data && data.hits.hits.length > 0) {
        return {
          id: _.get(data.hits.hits[0], '_id', ''),
          html: _.get(data.hits.hits[0], '_source.raw_content', '')
        };
      }
      return {
        id: '',
        html: ''
      };
    }
  };
})(_);

