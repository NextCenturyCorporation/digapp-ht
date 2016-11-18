/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* exported phoneTransform */
/* jshint camelcase:false */

var phoneTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    phone: function(data) {
      var phone = {};

      if(data && data.hits.hits.length > 0) {
        phone.id = _.get(data.hits.hits[0], '_source.uri');
        phone.telephoneNumber = _.get(data.hits.hits[0], '_source.name');
        phone.icon = commonTransforms.getIronIcon('phone');
        phone.styleClass = commonTransforms.getStyleClass('phone');
      }

      return phone;
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
});

