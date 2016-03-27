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

            if(data.hits.hits.length > 0) {
                newData._id = _.get(data.hits.hits[0], '_id');
                newData.date = _.get(data.hits.hits[0]._source, 'dateCreated');
                newData.address = commonTransforms.getAddress(data.hits.hits[0]._source.mainEntity);
                newData.title = _.get(data.hits.hits[0]._source, 'name[0]');
                newData.publisher = _.get(data.hits.hits[0]._source, 'publisher.name[0]');
                newData.body = _.get(data.hits.hits[0]._source, 'description[0]');
                newData.url = _.get(data.hits.hits[0]._source, 'url');
            }

            return newData;
        },
        pageRevisions: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.page_revisions.buckets, 'date', 'key_as_string');
            }

            return newData;            
        }
    };

})(_, commonTransforms);
