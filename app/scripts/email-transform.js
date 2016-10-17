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
    },

    cleanEmailBuckets: function(buckets) {
      return _.map(buckets, function(bucket) {
        return {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          doc_count: bucket.doc_count,
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          key: bucket.key,
          text: decodeURIComponent(bucket.key.substring(bucket.key.lastIndexOf('/') + 1))
        };
      });
    }
  };
})(_, relatedEntityTransform, commonTransforms);
