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
    telephone.sellerId = commonTransforms.getSellerId(record);
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
    }
  };
})(_, relatedEntityTransform, commonTransforms);

