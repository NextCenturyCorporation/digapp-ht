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
          'id': 'http://someuri/1234567890'
          'emailAddress': 'abc@xyz.com'
      }
  */
  function getEmail(record) {
    var email = {};
    email.id = _.get(record, 'uri');
    email.emailAddress = decodeURIComponent(_.get(record, 'name'));
    email.sellerId = commonTransforms.getSellerId(record);
    email.icon = commonTransforms.getIronIcon('email');
    email.styleClass = commonTransforms.getStyleClass('email');
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
    }
  };
})(_, relatedEntityTransform, commonTransforms);
