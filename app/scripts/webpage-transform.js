/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* exported webpageTransform */
/* jshint camelcase:false */

var webpageTransform = (function(_, commonTransforms, offerTransform) {
  return {
    // expected data is from an elasticsearch
    webpages: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var webpageObject = offerTransform.offerFromPaths(record, '_source', '_source.mainEntity.uri', '_source.dateCreated', '_source.mainEntity');
          webpageObject.highlightedText = _.get(record, 'highlight.name[0]') || null;
          if(webpageObject.details) {
            webpageObject.details[1].highlightedText = _.get(record, 'highlight.description[0]') || null;
          }
          newObj.data.push(webpageObject);
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
});
