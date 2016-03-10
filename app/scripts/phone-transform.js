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
        telephone.number = _.get(record, 'name[0]');
        telephone.type = 'Cell';
        telephone.origin = _.get(record, 'owner[0].makesOffer[0].availableAtOrFrom.address[0].addressLocality');
        //telephone.email = _.get(record, 'owner[0].email[0].name[0]');

        return telephone;
    }

    function getPrices(records) {
        var prices = [];
        records.forEach(function(record) {
            var priceArr = _.get(record, '_source.priceSpecification', []);
            priceArr.forEach(function(priceElem) {
                var price = {
                    amount: priceElem.price, 
                    unitCode: priceElem.unitCode, 
                    billingIncrement: priceElem.billingIncrement, 
                    date: record.validFrom
                };
                prices.push(price);
            });
        });
        return prices;
    }

    function getPeople(aggs) {
        var people = {

            names: commonTransforms.transformBuckets(aggs.people_names.buckets, 'name'),
            eyeColors: commonTransforms.transformBuckets(aggs.people_eye_colors.buckets, 'color'),
            hairColors: commonTransforms.transformBuckets(aggs.people_hair_color.buckets, 'color'),
            ethnicities: commonTransforms.transformBuckets(aggs.people_ethnicities.buckets, 'ethnicity'),
            heights: [], // TODO: determine if we can make aggregation for this
            //[{height: 64, count:5, unitOfMeasure: 'inches'}],
            weights:  [], // TODO: determine if we can make aggregation for this
            //[{weight: 115, count: 5, unitOfMeasure: 'pounds'}],
            ages: commonTransforms.transformBuckets(aggs.people_ages.buckets, 'age')
        };
        return people;
    }

    // "locations": [
    //     {
    //         "city": "hawthorn", 
    //         "state": "california", 
    //         "lat": 33.916403, 
    //         "lon": -118.352575,
    //         "date": "2012-04-23T18:25:43.511Z"
    //     }
    // ]
    function getLocations(records) {
        var locations = [];

        records.forEach(function(record) {
            var addresses = _.get(record, '_source.availableAtOrFrom.address', []);
            var lat = _.get(record, '_source.availableAtOrFrom.geo.lat');
            var lon = _.get(record, '_source.availableAtOrFrom.geo.lon');
            addresses.forEach(function(address) {
                var location = {
                    city: address.addressLocality,
                    state: address.addressRegion,
                    lat: lat,
                    lon: lon,
                    date: record._source.validFrom
                };
                locations.push(location);
            });
        });
        return locations;
    }

    function getGeoCoordinates(records) {
        var geos = [];

        records.forEach(function(record) {
            var addresses = _.get(record, '_source.availableAtOrFrom.address', []);
            var lat = _.get(record, '_source.availableAtOrFrom.geo.lat');
            var lon = _.get(record, '_source.availableAtOrFrom.geo.lon');
            addresses.forEach(function(address) {
                if (lat && lon) {
                    var geo = {
                        city: address.addressLocality,
                        state: address.addressRegion,
                        lat: lat,
                        lon: lon,
                        date: record._source.validFrom
                    };
                    geos.push(geo);                    
                }
            });
        });
        return geos;
    }

    // "offerTitles": [
    //     {"title": "hello world 4", "date": "2012-04-23T18:25:43.511Z"},
    //     {"title": "hello world 3", "date": "2012-04-22T18:25:43.511Z"},
    //     {"title": "hello world 2 ", "date": "2012-04-21T18:25:43.511Z"},
    //     {"title": "hello world 1", "date": "2012-04-20T18:25:43.511Z"}
    // ],
    function getOfferTitles(records) {
        var offerTitles = [];
        records.forEach(function(record) {
            offerTitles.push({title: record._source.title, date: record._source.validFrom});
        });

        return offerTitles;
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

                newData.prices = getPrices(data.hits.hits);
                newData.locations = getLocations(data.hits.hits);
                newData.offerTitles = getOfferTitles(data.hits.hits);
                newData.offerDates = commonTransforms.transformBuckets(aggs.offers_by_date.buckets, 'date', 'key_as_string');
                newData.offerCities = commonTransforms.transformBuckets(aggs.offers_by_city.buckets, 'city');
                newData.geoCoordinates = getGeoCoordinates(data.hits.hits);
                newData.relatedRecords = {
                    offer: relatedEntityTransform.offer(data)
                };
            }
            
            return newData;
        },
        people: function(data) {
            var newData = {};

            if(data.aggregations) {
                newData = getPeople(data.aggregations);
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


