/**
 * transform elastic search email query to display format.  See data-model.json
 */

/* globals _ */
/* exported emailTransform */

var emailTransform = (function(_) {
    function getEmailAddress(source) {
        return source.seller.email.name;
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
            if(hit._source.itemOffered) {
                var person = hit._source.itemOffered;
                weightsAggregator = extractField(person, weightsAggregator, "schema:weight");
                heightsAggregator = extractField(person, heightsAggregator, "schema:height");
            }
        });

        var people = {
            names: tranformBuckets(aggs.names.buckets, 'name'),
            eyeColors: tranformBuckets(aggs.eyeColors.buckets, 'color'),
            hairColors: tranformBuckets(aggs.hairColors.buckets, 'color'),
            ethnicities: [],//TODO this is not available through offer
            heights: unrollAggregator(heightsAggregator, 'height'),
            weights: unrollAggregator(weightsAggregator, 'weight'),
            ages: tranformBuckets(aggs.ages.buckets, 'age')
        };

        return people;
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

    function unrollAggregator(aggregator, keyName) {
        var array;

        _.each(aggregator, function(count, key) {
            var obj = {};
            obj[keyName] = key;
            obj.count = count;
            array.push(obj);
        })

        return array;
    }

    function tranformBuckets(buckets, keyName, alternateKey) {
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
        })
    }

    function getOfferTitles(hits) {
        var title = [];
        _.each(hits, function(hit) {
            title.push({
                title: hit._source.title,
                date: hit._source.validFrom
            })
        });
    }

    function getLocations(hits) {
        var locations = [];
        _.each(hits, function(hit) {
            var location = hit._source.availableAtOrFrom;
            if(location) {
                lat = _.get(location, 'geo.lat');
                lon = _.get(location, 'geo.lon');

                _.each(location.address, function(address) {
                    locations.push({
                        city: address.addressLocality,
                        state: address.addressRegion,
                        lat: lat,
                        lon: lon,
                        date: hit._source.validFrom
                    })
                });
            }
        });
    }

    function getOfferDates(aggs) {
        return tranformBuckets(aggs.offerDates, 'date', 'key_as_string');
    }

    return {
        email: function(data) {
            var newData = {};

            if(data.hits.hits[0]._source) {
                var hits = data.hits.hits;
                var aggs = data.aggregations;

                newData.emailAddress = getEmailAddress(hits[0]._source);
                newData.prices = getPrices(hits);
                newData.people = getPeople(hits, aggs);
                newData.offerTitles = getOfferTitles(hits);
                newData.locations = getLocations(hits);
                newData.offerDates = getOfferDates(aggs);
            }

            return newData;
        }
    };
})(_);
