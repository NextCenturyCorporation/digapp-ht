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

    function getGeoFromKeys(record) {
        
        var geos = [];
        _.each(record, function(key) {
            var geoData = key.key.split(':');
            var geo = {
                        city: geoData[0],
                        state: geoData[1],
                        country: geoData[2],
                        longitude: geoData[3],
                        latitude: geoData[4],
                        count: key.doc_count,
                        name: geoData[0] + ', ' + geoData[1]
                    };
            geos.push(geo);
        });
        return geos;
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

                    _.each(location.address, function(address) {
                        locations.push({
                            city: address.addressLocality,
                            state: address.addressRegion,
                            latitude: address.geo ? _.get(address, 'geo.latitude') : undefined,
                            longitude: address.geo ? _.get(address, 'geo.longitude') : undefined,
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

                addresses.forEach(function(address) {
                    var latitude = address.geo ? address.geo.latitude : undefined;
                    var longitude = address.geo ? address.geo.longitude : undefined;

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
        },

        getClickableObjectArr: function (records, type) {
            var result = [];
            if(records) {
                if(records.constructor === Array) {
                    records.forEach(function(record) {
                        if(record.name) {
                            var obj = {
                                _id: record.uri,
                                _type: type,
                                title: record.name,
                                subtitle: ''
                            };
                            result.push(obj);
                        }
                    });
                } else {
                    var obj = {
                        _id: records.uri,
                        _type: type,
                        title: records.name,
                        subtitle: ''
                    };
                    result.push(obj);
                }
            }
            
            return result;
        },
        offerTimelineData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                var aggs = data.aggregations;
                newData.offerTimeline = this.transformBuckets(aggs.offersPhone.offerTimeline.buckets, 'date', 'key_as_string');
            }
        
            return newData;
        },
        offerLocationData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                var aggs = data.aggregations;
                newData.offerLocation = getGeoFromKeys(aggs.phone.city.buckets);
            }
        
            return newData;
        },
        getSellerId: function(record) {
            var sellerId = '';
            if(record.owner) {

                if(_.isArray(record.owner)) {
                    //phone will have one seller 
                    sellerId = record.owner[0].uri;    
                }
                else {
                    sellerId = record.owner;
                }
                
            }

            return sellerId;
        },
        getEmailAndPhoneFromMentions: function(mentions) {
            var newData = {};
            newData.phones = [];
            newData.emails = [];

            if(mentions) {
                mentions.forEach(function(elem) {
                    var type = 'none';
                    if(elem.indexOf('phone') !== -1) {
                        type = 'phone';
                    } else if(elem.indexOf('email') !== -1) {
                        type = 'email';
                    }
                    if(type !== 'none') {
                        var idx = elem.lastIndexOf('/');
                        var text = elem.substring(idx+1);
                        var countryCode = '';
                        if (type === 'phone') {
                            if(text.indexOf('-') !== -1) {
                                var idx2 = text.indexOf('-');
                                text = text.substring(idx2+1);
                                var cc = text.substring(0,idx2);
                                if (cc.length < 5) {
                                    countryCode = cc;
                                }
                            }
                        }
                        var newObj = {
                            _id: elem,
                            _type: type,
                            title:  text,
                            subtitle: ''
                        };
                        if(type === 'phone') {
                            newData.phones.push(newObj);
                        }
                        else if(type === 'email') {
                            newData.emails.push(newObj);
                        }
                    }
                });
            }
            return newData;
        },
        makeJSONArray: function(val1, val2) {
            return [val1, val2];
        }
    };

})(_);


