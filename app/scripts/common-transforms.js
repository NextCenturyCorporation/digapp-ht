/**
 * Common transform functions used.
 */

/* globals _ */
/* exported commonTransforms */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var commonTransforms = (function(_) {

    /**
    * Path taken by extractPersonField when iterating over an array value
    */
    function extractPersonArrayField(person, aggregator, field) {
        if(person[field]) {
            _.each(person[field], function(val) {
                if(aggregator[val]) {
                    aggregator[val] = aggregator[val] + 1;
                } else {
                    aggregator[val] = {
                        count: 1
                    };
                }
            });
        }

        return aggregator;
    }

    /**
    * Creates person aggregation based on a set of records
    */
    function extractPersonField(person, aggregator, field) {
        if(person[field]) {
            if(person[field].constructor === Array) {
                return extractPersonArrayField(person, aggregator, field);
            } else {
                if(aggregator[person[field]]) {
                    aggregator[person[field]] = aggregator[person[field]] + 1;
                } else {
                    aggregator[person[field]] = 1;
                }

                return aggregator;
            }
        }
    }

    /**
    * Adds names (keyName and count) to key/value pairs.
    */
    function unrollAggregator(aggregator, keyName) {
        var array = [];

        _.each(aggregator, function(count, key) {
            var obj = {};
            obj[keyName] = key;
            obj.count = count;
            array.push(obj);
        });

        return array;
    }

    return {
        /**
        * Changes the key/value names of buckets given from an aggregation
        * to names preferred by the user. 
        */
        transformBuckets: function(buckets, keyName, alternateKey) {
            buckets = _.map(buckets, function(bucket) {
                var obj = {
                    count: bucket.doc_count
                };
                if(alternateKey) {
                    obj[keyName] = bucket[alternateKey];
                } else {
                    obj[keyName] = bucket.key;
                }
                return obj;
            });
            return buckets;
        },
        /**
        * Get price information and create array of price objects:
        * 
        *    "prices": [
        *        {"amount": 250,
        *        "unitCode": "MIN",
        *        "billingIncrement": 60,
        *        "date": "2012-04-23T18:25:43.511Z"},
        *        {"amount": 250,
        *        "unitCode": "MIN",
        *        "billingIncrement": 60,
        *        "date": "2012-04-15T18:25:43.511Z"}
        *    ],
        */
        getPrices: function(hits) {
            var prices = [];

            _.each(hits, function(hit) {
                if(hit._source.priceSpecification) {
                    _.each(hit._source.priceSpecification, function(price) {
                        prices.push({
                            amount: price.price,
                            unitCode: price.unitCode,
                            billingIncrement: price.billingIncrement,
                            date: hit._source.validFrom
                        });
                    });
                }
            });

            return prices;
        },
        /**
            Get people aggregation info:
         
            "people": {
                "names": [
                    {"name": "Emily", "count": 14},
                    {"name": "Erin", "count": 12},
                    {"name": "Jane", "count": 3}
                ],
                "eyeColors": [
                    {"color": "blue", "count": 7},
                    {"color": "brown", "count": 4}
                ],
                "hairColors": [{"color": "brown", "count": 7},
                    {"color": "brown", "count": 4}
                ],
                "ethnicities": [
                    {"ethnicity": "white", "count": 19}
                ],
                "heights": [{"height": 64, "count":5, "unitOfMeasure": "inches"}],
                "weights": [{"weight": 115, "count": 5, "unitOfMeasure": "pounds"}],
                "ages": [{"age": 30, "count": 9}]
            }
        */
        getPeople: function(aggs) {
            var people = {
                names: this.transformBuckets(aggs.people_names.buckets, 'name'),
                eyeColors: this.transformBuckets(aggs.people_eye_colors.buckets, 'color'),
                hairColors: this.transformBuckets(aggs.people_hair_color.buckets, 'color'),
                ethnicities: this.transformBuckets(aggs.people_ethnicities.buckets, 'ethnicity'),
                ages: this.transformBuckets(aggs.people_ages.buckets, 'age')
            };

            return people;
        },
        /**
            "locations": [
                {
                    "city": "hawthorn",
                    "state": "california",
                    "lat": 33.916403, 
                    "lon": -118.352575,
                    "date": "2012-04-23T18:25:43.511Z"
                }
            ] 
        */
        getLocations: function(hits) {
            var locations = [];
            _.each(hits, function(hit) {
                var location = hit._source.availableAtOrFrom;
                if(location) {
                    var lat = _.get(location, 'geo.lat');
                    var lon = _.get(location, 'geo.lon');

                    _.each(location.address, function(address) {
                        locations.push({
                            city: address.addressLocality,
                            state: address.addressRegion,
                            lat: lat,
                            lon: lon,
                            date: hit._source.validFrom
                        });
                    });
                }
            });

            return locations;
        },
        /**
            where lat and lon are required: 
            "geoCoordinates": [
                {
                    "city": "hawthorn",
                    "state": "california",
                    "lat": 33.916403,
                    "lon": -118.352575,
                    "date": "2012-04-23T18:25:43.511Z"
                }
            ]
        */
        getGeoCoordinates: function(records) {
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
        },

        /**
            "offerTitles": [
                {"title": "hello world 4", "date": "2012-04-23T18:25:43.511Z"},
                {"title": "hello world 3", "date": "2012-04-22T18:25:43.511Z"},
                {"title": "hello world 2 ", "date": "2012-04-21T18:25:43.511Z"},
                {"title": "hello world 1", "date": "2012-04-20T18:25:43.511Z"}
            ]
        */
        getOfferTitles: function(hits) {
            var titles = [];
            _.each(hits, function(hit) {
                titles.push({
                    title: hit._source.title,
                    date: hit._source.validFrom
                });
            });
            return titles;
        }

    };

})(_);


