/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported webpageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var webpageTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    webpage: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData._id = _.get(data.hits.hits[0], '_id');
        newData.date = _.get(data.hits.hits[0]._source, 'dateCreated');
        newData.address = commonTransforms.getAddress(data.hits.hits[0]._source.mainEntity);
        newData.title = _.get(data.hits.hits[0]._source, 'name');
        newData.publisher = _.get(data.hits.hits[0]._source, 'publisher.name');
        newData.body = _.get(data.hits.hits[0]._source, 'description');
        newData.url = _.get(data.hits.hits[0]._source, 'url');
        var mentions = _.get(data.hits.hits[0]._source, 'mentions');
        var extractedMentions = commonTransforms.getEmailAndPhoneFromMentions(mentions);
        newData.phones = extractedMentions.phones;
        newData.emails = extractedMentions.emails;
        newData.communications = extractedMentions.phones.concat(extractedMentions.emails);
        newData.showCommunications = (newData.communications.length > 1);
      }

      return newData;
    },
    webpageRevisions: function(data) {
      var newData = {};

      if(data && data.aggregations) {
        newData.list = commonTransforms.transformBuckets(data.aggregations.revisions.revisions.buckets, 'date', 'key_as_string');
        newData.show = (newData.list.length > 1);
      }

      return newData;
    }
  };
})(_, commonTransforms);
