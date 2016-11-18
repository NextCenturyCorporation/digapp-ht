/**
 * transform elastic search email query to display format.  See data-model.json
 */

/* exported emailTransform */
/* jshint camelcase:false */

var emailTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    email: function(data) {
      var email = {};

      if(data && data.hits.hits.length > 0) {
        email.id = _.get(data.hits.hits[0], '_source.uri');
        email.emailAddress = decodeURIComponent(_.get(data.hits.hits[0], '_source.name'));
        email.icon = commonTransforms.getIronIcon('email');
        email.styleClass = commonTransforms.getStyleClass('email');
      }

      return email;
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
});
