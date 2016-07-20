/**
 * transform elastic search email query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported emailTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var emailTransform = (function(_, relatedEntityTransform, commonTransforms) {

  /** build email object:
      'email': {
          '_id': 'http://someuri/1234567890'
          'emailAddress': 'abc@xyz.com'
      }
  */
  function getEmail(record) {
    var email = {};
    email._id = _.get(record, 'uri');
    email.emailAddress = decodeURIComponent(_.get(record, 'name'));
    email.sellerId = commonTransforms.getSellerId(record);
    return email;
  }

  return {
    // expected data is from an elasticsearch
    email: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData = getEmail(data.hits.hits[0]._source);
      }

      return newData;
    },

    emailOffersData: function(data) {
      var newData = {};
      newData.relatedOffers = relatedEntityTransform.offer(data);
      return newData;
    },

    computeShowSeller: function(seller, email) {
      var sellerOut = [];
      _.each(seller, function(record) {
        if(record.title !== email) {
          sellerOut.push(record);
        }
      });
      if(sellerOut.length > 0) {
        return sellerOut;
      }
      return undefined;
    }
  };
})(_, relatedEntityTransform, commonTransforms);
