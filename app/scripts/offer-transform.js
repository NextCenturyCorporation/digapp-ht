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
        var latitude = _.get(record, 'availableAtOrFrom.address[0].geo.latitude');
        var longitude = _.get(record, 'availableAtOrFrom.address[0].geo.longitude');

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

    function parseOffer(record) {
        var newData = {};
        
        newData.date = _.get(record, 'validFrom');
        newData.address = commonTransforms.getAddress(record);
        newData.geo = getGeolocation(record);
        newData.person = getPerson(record);
        newData.title = _.get(record, 'title', 'Title N/A');
        newData.publisher = _.get(record, 'mainEntityOfPage.publisher.name');
        newData.body = _.get(record, 'mainEntityOfPage.description');
        //newData.emails = commonTransforms.getArrayOfStrings(data.hits.hits[0], '_source.seller.email', 'name');
        //newData.phones = commonTransforms.getArrayOfStrings(data.hits.hits[0], '_source.seller.telephone', 'name');
        // only get one of each for now
        newData.emails = commonTransforms.getClickableObjectArr(_.get(record, 'seller.email'), 'email');
        newData.phones = commonTransforms.getClickableObjectArr(_.get(record, 'seller.telephone'), 'phone');
        newData.sellerId = _.get(record, 'seller.uri');
        newData.serviceId = _.get(record, 'itemOffered.uri');
        newData.webpageId = _.get(record, 'mainEntityOfPage.uri');
        newData.webpageUrl = _.get(record, 'mainEntityOfPage.url');
        
        return newData;
    }
    return {
        // expected data is from an elasticsearch 
        offer: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData = parseOffer(data.hits.hits[0]._source);
            }

            // aggregation data for sparklines -- currently unused
            if(data.aggregations) {
                var aggs = data.aggregations;
                newData.offersBySeller = commonTransforms.transformBuckets(aggs.offers_by_seller.buckets, 'date', 'key_as_string');
                newData.offerLocsBySeller = commonTransforms.transformBuckets(aggs.offer_locs_by_seller.buckets, 'city');
            }

            return newData;
        },

        revisions: function(data) {
            var newData = [];

            if(data.hits.hits.length > 0) {
                data.hits.hits.forEach(function(elem) {
                    offer = parseOffer(elem._source);
                    offer._id = elem._id;
                    offer._type = 'offer';
                    newData.push(offer);
                });
            }

            return newData;
        }
    };

})(_, commonTransforms);
