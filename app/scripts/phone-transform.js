/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform*/
var phoneTransform = (function(_, relatedEntityTransform) {

    function getTelephone(record) {
        /** build telephone object:
        'telephone': {
            'uri': 'http://someuri/1234567890'
            'number': '1234567890',
            'type': 'cell',
            'origin': 'Washington DC'
        }
        */
        var telephone = {};
        telephone.uri = _.get(record, 'uri');
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

    function getPeopleNames(names) {
        // [{name: 'Emily', 'count': 14}, 
        // {name: 'Erin', 'count': 12},
        // {name: 'Jane', 'count': 3}]
        var peopleNames = [];
        names.buckets.forEach(function(elem) {
            var nameAgg = {name: elem.key, count: elem.doc_count};
            peopleNames.push(nameAgg);
        });
        return peopleNames;
    }

    function getPeopleEyeColors(eyeColors) {
        // [
        //     {color: 'blue', 'count': 7},
        //     {color: 'brown', 'count': 4}        
        // ],
        var peopleEyeColors = [];
        eyeColors.buckets.forEach(function(elem) {
            var eyeColorAgg = {color: elem.key, count: elem.doc_count};
            peopleEyeColors.push(eyeColorAgg);
        });
        return peopleEyeColors;
    }

    function getPeopleHairColors(hairColors) {
        // [{'color': 'brown', 'count': 7},
        //     {'color': 'brown', 'count': 4}
        // ],
        var peopleHairColors = [];
        hairColors.buckets.forEach(function(elem) {
            var hairColorAgg = {color: elem.key, count: elem.doc_count};
            peopleHairColors.push(hairColorAgg);
        });
        return peopleHairColors;
    }

    function getPeopleAges(ages) {
        //[{"age": 30, "count": 9}]
        var results = [];
        ages.buckets.forEach(function(elem) {
            var obj = {age: parseInt(elem.key), count: elem.doc_count};
            results.push(obj);
        });
        return results;
    }

    function getPeople(aggs) {
        var people = {

            names: getPeopleNames(aggs.people_names),
          
            eyeColors: getPeopleEyeColors(aggs.people_eye_colors),

            hairColors: getPeopleHairColors(aggs.people_hair_color),

            ethnicities: [], // TODO: request this in elasticsearch
            // [
            //     {'ethnicity': 'white', 'count': 19}
            // ],
            heights: [], // TODO: determine if we can make aggregation for this
            //[{height: 64, count:5, unitOfMeasure: 'inches'}],
            weights:  [], // TODO: determine if we can make aggregation for this
            //[{weight: 115, count: 5, unitOfMeasure: 'pounds'}],
            ages: getPeopleAges(aggs.people_ages)
            //[{age: 30, count: 9}]
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

    // [
    //     {"date": "2012-04-23T18:25:43.511Z", "count": 2},
    //     {"date": "2012-04-23T18:25:43.511Z", "count": 1},
    //     {"date": "2012-04-23T18:25:43.511Z", "count": 1},
    //     {"date": "2012-04-23T18:25:43.511Z", "count": 1},
    //     {"date": "2012-04-23T18:25:43.511Z", "count": 3},
    //     {"date": "2012-04-15T18:25:43.511Z", "count": 1},
    //     {"date": "2012-04-12T18:25:43.511Z", "count": 1}
    // ]
    function getOfferDates(aggs) {
        var dates = [];

        aggs.offers_by_date.buckets.forEach(function(elem) {
            dates.push({date: elem.key_as_string, count: elem.doc_count});
        });
        return dates;
    }

    // [
    //     {"city": "Los Angeles", "count": 10}, {}
    // ]
    function getOfferCities(aggs) {
        var cities = [];

        aggs.offers_by_city.buckets.forEach(function(elem) {
            cities.push({city: elem.key, count: elem.doc_count});
        });
        return cities;
    }

    function getRelatedPhones(aggs) {
        // [{"number": 1234567, "count": 2}]
        var relatedPhones = [];
        var phoneBuckets = _.get(aggs, 'related_phones.buckets', []);

        phoneBuckets.forEach(function(phoneBucket) {
            var relatedPhone = {
                number: phoneBucket.key,
                count: phoneBucket.doc_count
            };
            relatedPhones.push(relatedPhone);
        });

        return relatedPhones;
    }

    function getRelatedEmails(aggs) {
        // [{"email": "abc@xyz.com", "count": 2}]
        var relatedEmails = [];
        var emailBuckets = _.get(aggs, 'related_emails.buckets', []);

        emailBuckets.forEach(function(emailBucket) {
            var relatedEmail = {
                email: emailBucket.key,
                count: emailBucket.doc_count
            };
            relatedEmails.push(relatedEmail);
        });

        return relatedEmails;
    }

    function getRelatedWebsites(aggs) {
        // [{"webSite": "backpage.com", "count": 3}]
        var relatedWebsites = [];
        var websiteBuckets = _.get(aggs, 'related_websites.buckets', []);

        websiteBuckets.forEach(function(websiteBucket) {
            var relatedWebsite = {
                webSite: websiteBucket.key,
                count: websiteBucket.doc_count
            };
            relatedWebsites.push(relatedWebsite);
        });

        return relatedWebsites;
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
                newData.prices = getPrices(data.hits.hits);
                newData.locations = getLocations(data.hits.hits);
                newData.offerTitles = getOfferTitles(data.hits.hits);
                newData.offerDates = getOfferDates(data.aggregations);
                newData.offerCities = getOfferCities(data.aggregations);
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
                newData.relatedPhones = getRelatedPhones(data.aggregations);
                newData.relatedEmails = getRelatedEmails(data.aggregations);
                newData.relatedWebsites = getRelatedWebsites(data.aggregations);
            }
            
            return newData;
        }
    };

})(_, relatedEntityTransform);


