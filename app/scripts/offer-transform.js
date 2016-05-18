/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported offerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var offerTransform = (function(_, commonTransforms) {

    function getGeolocation(record) {
        /** build geolocation object:
        "geo": { 
            "latitude": 33.916403, 
            "longitude": -118.352575
        }
        
        if no latitude && longitude, return undefined 
        */
        var geo;
        var latitude = _.get(record, 'availableAtOrFrom.address[0].geo.lat');
        var longitude = _.get(record, 'availableAtOrFrom.address[0].geo.lon');

        if(latitude && longitude) {
            geo = {};
            geo.latitude = latitude;
            geo.longitude = longitude;
        }

        return geo;
    }

    function getPerson(record) {
        /** build person object:
        "person": {
            "name": "Emily",
            "ethnicities": ["white"],
            "height": 64,
            "weight": 115,
            "ages": [20]
        }
        */
        var person = {};
        person.name = _.get(record, 'itemOffered.name', 'Name N/A');
        person.ethnicities = _.get(record, 'itemOffered.ethnicity');
        person.height = _.get(record, 'itemOffered.height');
        person.weight = _.get(record, 'itemOffered.weight');
        person.ages = _.get(record, 'itemOffered.age');
        return person;
    }

    return {
        // expected data is from an elasticsearch 
        offer: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData.date = _.get(data.hits.hits[0]._source, 'validFrom');
                newData.address = commonTransforms.getAddress(data.hits.hits[0]._source);
                newData.geo = getGeolocation(data.hits.hits[0]._source);
                newData.person = getPerson(data.hits.hits[0]._source);
                newData.title = _.get(data.hits.hits[0]._source, 'title', 'Title N/A');
                newData.publisher = _.get(data.hits.hits[0]._source, 'mainEntityOfPage.publisher.name');
                newData.body = _.get(data.hits.hits[0]._source, 'mainEntityOfPage.description');
                //newData.emails = commonTransforms.getArrayOfStrings(data.hits.hits[0], '_source.seller.email', 'name');
                //newData.phones = commonTransforms.getArrayOfStrings(data.hits.hits[0], '_source.seller.telephone', 'name');
                // only get one of each for now
                newData.emails = [_.get(data.hits.hits[0]._source, 'seller.email.name', '')];
                newData.phones = [_.get(data.hits.hits[0]._source, 'seller.telephone.name', '')];
                newData.sellerId = _.get(data.hits.hits[0]._source, 'seller.uri');
                newData.serviceId = _.get(data.hits.hits[0]._source, 'itemOffered.uri');
                newData.webpageId = _.get(data.hits.hits[0]._source, 'mainEntityOfPage.uri');
            }

            // aggregation data for sparklines -- currently unused
            if(data.aggregations) {
                var aggs = data.aggregations;
                newData.offersBySeller = commonTransforms.transformBuckets(aggs.offers_by_seller.buckets, 'date', 'key_as_string');
                newData.offerLocsBySeller = commonTransforms.transformBuckets(aggs.offer_locs_by_seller.buckets, 'city');
            }

            return newData;
        }
    };

})(_, commonTransforms);
