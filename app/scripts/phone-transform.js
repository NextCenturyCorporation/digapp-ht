/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var phoneTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function getTelephone(record) {
    /** build telephone object:
    'telephone': {
        'id': 'http://someuri/1234567890'
        'number': '1234567890',
        'type': 'cell',
        'origin': 'Washington DC'
    }
    */
    var telephone = {};
    telephone.id = _.get(record, 'uri');
    telephone.number = _.get(record, 'name');
    telephone.icon = commonTransforms.getIronIcon('phone');
    telephone.styleClass = commonTransforms.getStyleClass('phone');
    return telephone;
  }

  return {
    // expected data is from an elasticsearch
    telephone: function(data) {
      var newData = {};
      if(data && data.hits.hits.length > 0) {
        newData = getTelephone(data.hits.hits[0]._source);
      }

      return newData;
    },

    phoneOffersData: function(data) {
      var newData = {};
      newData.relatedOffers = relatedEntityTransform.offer(data);
      return newData;
    },

    cleanPhoneBuckets: function(buckets) {
      return _.map(buckets, function(bucket) {
        var text = bucket.key.substring(bucket.key.lastIndexOf('/') + 1);
        if(text.indexOf('-') >= 0) {
          text = text.substring(text.indexOf('-') + 1);
        }
        return {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          doc_count: bucket.doc_count,
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          key: bucket.key,
          text: text
        };
      });
    }
  };
})(_, relatedEntityTransform, commonTransforms);

