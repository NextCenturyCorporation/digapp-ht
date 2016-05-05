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
        return value.latitude === other.latitude && value.longitude === other.longitude;
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
            Get people aggregation info:
         
            "people": {
                "names": [
                    {"name": "Emily", "count": 14},
                    {"name": "Erin", "count": 12},
                    {"name": "Jane", "count": 3}
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
                    "latitude": 33.916403, 
                    "longitude": -118.352575,
                    "date": "2012-04-23T18:25:43.511Z"
                }
            ] 
        */
        getLocations: function(hits) {
            var locations = [];
            _.each(hits, function(hit) {
                var location = hit._source.availableAtOrFrom;
                if(location) {
                    var latitude = _.get(location, 'geo.latitude');
                    var longitude = _.get(location, 'geo.longitude');

                    _.each(location.address, function(address) {
                        locations.push({
                            city: address.addressLocality,
                            state: address.addressRegion,
                            latitude: latitude,
                            longitude: longitude,
                            date: hit._source.validFrom
                        });
                    });
                }
            });

            return locations;
        },
        /**
            where latitude and longitude are required: 
            "geoCoordinates": [
                {
                    "city": "hawthorn",
                    "state": "california",
                    "latitude": 33.916403,
                    "longitude": -118.352575
                }
            ]
        */
        getGeoCoordinates: function(records) {
            var geos = [];

            records.forEach(function(record) {
                var addresses = _.get(record, '_source.availableAtOrFrom.address', []);
                var latitude = _.get(record, '_source.availableAtOrFrom.geo.latitude');
                var longitude = _.get(record, '_source.availableAtOrFrom.geo.longitude');
                addresses.forEach(function(address) {
                    if (latitude && longitude) {
                        var geo = {
                            city: address.addressLocality,
                            state: address.addressRegion,
                            latitude: latitude,
                            longitude: longitude
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
            "formattedAddress": 'Los Angeles, California'
        }
        */
        getAddress: function(record) {
            var address = {};
            address.locality = _.get(record, 'availableAtOrFrom.address[0].addressLocality');
            address.region = _.get(record, 'availableAtOrFrom.address[0].addressRegion');

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


