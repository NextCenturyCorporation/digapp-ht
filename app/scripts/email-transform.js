/**
 * transform elastic search email query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported emailTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var emailTransform = (function(_, relatedEntityTransform, commonTransforms) {

    /** build email object:
        'email': {
            '_id': 'http://someuri/1234567890'
            'emailAddress': 'abc@xyz.com'
        }
    */
    function getEmail(record) {
        var email = {};
        email._id = _.get(record, '_id');
        email.emailAddress = _.get(record, 'name[0]');

        return email;
    }

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

    function getPrices(hits) {
        var prices = [];

        _.each(hits, function(hit) {
            if(hit._source.priceSpecification) {
                _.each(hit._source.priceSpecification, function(price) {
                    prices.push({
                        price: price.price,
                        unitCode: price.unitCode,
                        billingIncrement: price.billingIncrement,
                        date: hit._source.validFrom
                    });
                });
            }
        });

        return prices;
    }

    function getPeople(hits, aggs) {
        var heightsAggregator = {};
        var weightsAggregator = {};

        _.each(hits, function(hit) {
            if(hit._source) {
                var person = hit._source;
                weightsAggregator = extractPersonField(person, weightsAggregator, 'schema:weight');
                heightsAggregator = extractPersonField(person, heightsAggregator, 'schema:height');
            }
        });

        var people = {
            names: commonTransforms.transformBuckets(aggs.people_names.buckets, 'name'),
            eyeColors: commonTransforms.transformBuckets(aggs.people_eye_colors.buckets, 'color'),
            hairColors: commonTransforms.transformBuckets(aggs.people_hair_color.buckets, 'color'),
            ethnicities: commonTransforms.transformBuckets(aggs.people_ethnicities.buckets, 'ethnicity'),
            heights: commonTransforms.unrollAggregator(heightsAggregator, 'height'),
            weights: commonTransforms.unrollAggregator(weightsAggregator, 'weight'),
            ages: commonTransforms.transformBuckets(aggs.people_ages.buckets, 'age')
        };

        return people;
    }

    function getOfferTitles(hits) {
        var title = [];
        _.each(hits, function(hit) {
            title.push({
                title: hit._source.title,
                date: hit._source.validFrom
            });
        });
    }

    function getLocations(hits) {
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

    return {
        // expected data is from an elasticsearch
        email: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData = getEmail(data.hits.hits[0]._source);
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

            if(data.hits.hits.length > 0 && data.aggregations) {
                newData = getPeople(data.hits.hits, data.aggregations);
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
