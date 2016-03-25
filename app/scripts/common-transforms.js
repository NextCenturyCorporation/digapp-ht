/**
 * Common transform functions used.
 */

/* globals _ */
/* exported commonTransforms */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var commonTransforms = (function(_) {

    /**
    * Check for geolocation equality
    */
    function isGeolocationEqual(value, other) {
        return value.lat === other.lat && value.lon === other.lon;
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
        * Get price information from offers and create array of price objects:
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
                    "lon": -118.352575
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
                            lon: lon
                        };
                        geos.push(geo);
                    }
                });
                // Removing duplicates for better map display
                geos = _.uniqWith(geos, isGeolocationEqual);
            });

            return geos;
        },
        /** build address object:
        "address": {
            "locality": "Los Angeles",
            "region": "California",
            "country": "US",
            "formattedAddress": 'Los Angeles, California, US'
        }
        */
        getAddress: function(record) {
            var address = {};
            address.locality = _.get(record, 'availableAtOrFrom.address[0].addressLocality');
            address.region = _.get(record, 'availableAtOrFrom.address[0].addressRegion');
            address.country = _.get(record, 'availableAtOrFrom.address[0].addressCountry');

            var formattedAddress = [];
            if(address.locality) {
                formattedAddress.push(address.locality);
            }

            if(address.region) {
                if(formattedAddress.length > 0) {
                    formattedAddress.push(', ');
                }
                formattedAddress.push(address.region);
            }

            if(address.country) {
                if(formattedAddress.length > 0) {
                    formattedAddress.push(', ');
                }
                formattedAddress.push(address.country);
            }

            address.formattedAddress = formattedAddress.join('');

            if(_.isEmpty(address.formattedAddress)) {
                address.formattedAddress = 'Address N/A';
            }

            return address;
        },
        /** build an array of strings:
            example: ["1112223333", "0123456789"]
        */
        getArrayOfStrings: function(record, pathToArray, pathToString) {
            var arrayToReturn = [];
            var initialArray = _.get(record, pathToArray, []);

            initialArray.forEach(function(element) {
                arrayToReturn.push(_.get(element, pathToString));
            });

            return arrayToReturn;
        }
    };

})(_);


