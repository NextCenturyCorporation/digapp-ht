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
            '_id': 'http://someuri/1234567890'
            'emailAddress': 'abc@xyz.com'
        }
    */
    function getEmail(record) {
        var email = {};
        email._id = _.get(record, 'uri');
        email.emailAddress = _.get(record, 'name');

        return email;
    }

    return {
        // expected data is from an elasticsearch
        email: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData = getEmail(data.hits.hits[0]._source);
            }

            return newData;
        },
        offerData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                var aggs = data.aggregations;

                newData.locations = commonTransforms.getLocations(data.hits.hits);
                newData.offerDates = commonTransforms.transformBuckets(aggs.offers_by_date.buckets, 'date', 'key_as_string');
                newData.offerCities = commonTransforms.transformBuckets(aggs.offers_by_city.buckets, 'city');
                newData.geoCoordinates = commonTransforms.getGeoCoordinates(data.hits.hits);
                newData.relatedOffers = relatedEntityTransform.offer(data);
            }

            return newData;
        },
        people: function(data) {
            var newData = {};

            if(data.aggregations) {
                newData = commonTransforms.getPeople(data.aggregations);
            }

            return newData;
        },
        seller: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData.relatedPhones = commonTransforms.transformBuckets(aggs.related_phones.buckets, 'number');
                newData.relatedEmails = commonTransforms.transformBuckets(aggs.related_emails.buckets, 'email');
                newData.relatedWebsites = commonTransforms.transformBuckets(aggs.related_websites.buckets, 'webSite');
            }

            return newData;
        }
    };
})(_, relatedEntityTransform, commonTransforms);
