/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should commonTransforms */
var phoneTransform = (function(_, commonTransforms) {

  function getPhone(record) {
    /** build phone object:
    'phone': {
        'id': 'http://someuri/1234567890'
        'telephoneNumber': '1234567890',
        'type': 'cell',
        'origin': 'Washington DC'
    }
    */
    var phone = {};
    phone.id = _.get(record, 'uri');
    phone.telephoneNumber = _.get(record, 'name');
    phone.icon = commonTransforms.getIronIcon('phone');
    phone.styleClass = commonTransforms.getStyleClass('phone');
    return phone;
  }

  return {
    // expected data is from an elasticsearch
    phone: function(data) {
      var newData = {};
      if(data && data.hits.hits.length > 0) {
        newData = getPhone(data.hits.hits[0]._source);
      }

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
})(_, commonTransforms);

