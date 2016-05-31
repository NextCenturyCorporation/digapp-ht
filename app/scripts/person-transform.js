/**
 * transform elastic search person queries to display format.  See data-model.json
 */

/* globals _, commonTransforms, relatedEntityTransform */
/* exported personTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms and relatedEntityTransform*/
var personTransform = (function(_, commonTransforms, relatedEntityTransform) {

    return {
        // expected data is from an elasticsearch

        /** build person object:
        "person": {
            "_id": "http://someuri/",
            "name": "Emily", 
            "eyeColor": "blue",
            "hairColor": "brown",
            "height": 64,
            "weight": 115,
            "age": 20
        }
        */
        person: function(data) {
            var newData = {};
            
            if(data.hits.hits.length > 0) {
                newData._id = _.get(data.hits.hits[0], '_id');
                newData.name = _.get(data.hits.hits[0]._source, 'name', 'Name N/A');
                newData.ethnicity = _.get(data.hits.hits[0]._source, 'ethnicity');
                newData.height = _.get(data.hits.hits[0]._source, 'height');
                newData.weight = _.get(data.hits.hits[0]._source, 'weight');
                newData.age = _.get(data.hits.hits[0]._source, 'age');
            }

            return newData;
        },
        offerData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData.locations = commonTransforms.getLocations(data.hits.hits);
                newData.geoCoordinates = commonTransforms.getGeoCoordinates(data.hits.hits);
                newData.relatedOffers = relatedEntityTransform.offer(data);
            }

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData.offerDates = commonTransforms.transformBuckets(aggs.offers_with_person.buckets, 'date', 'key_as_string');
                newData.offerCities = commonTransforms.transformBuckets(aggs.locs_for_person.buckets, 'city');
                newData.emails = commonTransforms.getArrayOfStrings(aggs.emails_for_person, 'buckets', 'key');
                newData.phones = commonTransforms.getArrayOfStrings(aggs.phones_for_person, 'buckets', 'key');
            }

            return newData;
        },
        relatedPhones: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.assoc_numbers.buckets, 'number');
            }
            
            return newData;
        },
        relatedEmails: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.assoc_emails.buckets, 'email');
            }
            
            return newData;
        }
    };

})(_, commonTransforms, relatedEntityTransform);