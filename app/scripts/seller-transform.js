/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {
    return {
        // expected data is from an elasticsearch 
        seller: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData._id = _.get(data.hits.hits[0], '_id');
                newData.telephone = _.get(data.hits.hits[0]._source, 'telephone.name');
                newData.emailAddress = _.get(data.hits.hits[0]._source, 'email.name');
                newData.title = 'Seller (' + (newData.telephone || newData.emailAddress || 'Info N/A') + ')';
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
        offerData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0 && data.aggregations) {
                var aggs = data.aggregations;

                newData.locations = commonTransforms.getLocations(data.hits.hits);
                newData.offerDates = commonTransforms.transformBuckets(aggs.offers_by_seller.buckets, 'date', 'key_as_string');
                newData.offerCities = commonTransforms.transformBuckets(aggs.offer_locs_by_seller.buckets, 'city');
                newData.geoCoordinates = commonTransforms.getGeoCoordinates(data.hits.hits);
            }
            
            return newData;
        },
        relatedPhones: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.seller_assoc_numbers.buckets, 'number');
            }
            
            return newData;
        },
        relatedEmails: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.seller_assoc_emails.buckets, 'email');
            }
            
            return newData;
        }        
    };

})(_, relatedEntityTransform, commonTransforms);


