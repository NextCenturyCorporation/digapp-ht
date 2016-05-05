/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var phoneTransform = (function(_, relatedEntityTransform, commonTransforms) {

    function getTelephone(record) {
        /** build telephone object:
        'telephone': {
            '_id': 'http://someuri/1234567890'
            'number': '1234567890',
            'type': 'cell',
            'origin': 'Washington DC'
        }
        */
        var telephone = {};
        telephone._id = _.get(record, 'uri');
        telephone.number = _.get(record, 'name');
        telephone.type = 'Cell';
        telephone.origin = _.get(record, 'owner[0].makesOffer[0].availableAtOrFrom.address[0].addressLocality');
        //telephone.email = _.get(record, 'owner[0].email[0].name[0]');

        return telephone;
    }

    return {
        // expected data is from an elasticsearch 
        telephone: function(data) {
            var newData = {};
            if(data.hits.hits.length > 0) {
                newData = getTelephone(data.hits.hits[0]._source);
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


