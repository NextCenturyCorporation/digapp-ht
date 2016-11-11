/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported webpageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var webpageTransform = (function(_, commonTransforms) {

  function getWebpageSummary(record) {
    var object = commonTransforms.getOfferObject(record, '_source', '_source.mainEntity.uri', '_source.dateCreated', '_source.mainEntity');
    object.highlightedText = _.get(record, 'highlight.name[0]');
    object.details[1].highlightedText = _.get(record, 'highlight.description[0]');
    return object;
  }

  return {
    // expected data is from an elasticsearch
    webpage: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData.id = _.get(data.hits.hits[0], '_id');
        newData.icon = commonTransforms.getIronIcon('webpage');
        newData.styleClass = commonTransforms.getStyleClass('webpage');
        newData.phones = commonTransforms.getMentions(_.get(data.hits.hits[0]._source, 'mentionsPhone', []), 'phone');
        newData.emails = commonTransforms.getMentions(_.get(data.hits.hits[0]._source, 'mentionsEmail', []), 'email');
        newData.communications = newData.phones.concat(newData.emails);
        newData.showCommunications = (newData.communications.length > 1);
      }

      return newData;
    },

    webpages: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var webpageSummary = getWebpageSummary(record);
          newObj.data.push(webpageSummary);
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },

    webpageRevisions: function(data) {
      if(data && data.aggregations) {
        var total = 0;
        var revisions = _.map(data.aggregations.revisions.revisions.buckets, function(bucket) {
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          total += bucket.doc_count;
          return {
            date: commonTransforms.getDate(bucket.key_as_string),
            icon: commonTransforms.getIronIcon('date'),
            styleClass: commonTransforms.getStyleClass('date'),
            count: bucket.doc_count
          };
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
        return (total < 2 ? [] : revisions);
      }
      return [];
    }
  };
})(_, commonTransforms);
