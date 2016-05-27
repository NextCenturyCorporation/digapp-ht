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
                newData.title = _.get(data.hits.hits[0]._source, 'name');
                newData.publisher = _.get(data.hits.hits[0]._source, 'publisher.name');
                newData.body = _.get(data.hits.hits[0]._source, 'description');
                newData.url = _.get(data.hits.hits[0]._source, 'url');
                var mentions = _.get(data.hits.hits[0]._source, 'mentions');
                var extractedMentions = commonTransforms.getEmailAndPhoneFromMentions(mentions);
                newData.phones = extractedMentions.phones;
                newData.emails = extractedMentions.emails;
                // newData.phones = [];
                // newData.emails = [];
                // mentions.forEach(function(elem) {
                //     type = 'none';
                //     if(elem.indexOf('phone') != -1) {
                //         type = 'phone'
                //     } else if(elem.indexOf('email') != -1) {
                //         type = 'email'
                //     }
                //     if(type != 'none') {
                //         idx = elem.lastIndexOf("/")
                //         text = elem.substring(idx+1)
                //         var newObj = {
                //             _id: elem,
                //             _type: type,
                //             title:  text,
                //             subtitle: ''
                //         }
                //         if(type == 'phone')
                //             newData.phones.push(newObj);
                //         else if(type == 'email')
                //             newData.emails.push(newObj);
                //     }
                // });
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
