/**
 * transform elastic search email query to display format.  See data-model.json
 */

/* globals _ */
/* exported emailTransform */

var emailTransform = (function(_) {
    function getEmailAddress(source) {
        return source.seller.email.name;
    }

    /*
            [{"price": 250,
            "unitCode": "MIN",
            "billingIncrement": 60,
            "date": "2012-04-23T18:25:43.511Z"}]

    */
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

    function getPeople(hits) {
        var nameAggregator = {};
        var eyeColorsAggregator = {};
        var hairColorsAggregator = {};
        var ethnicitiesAggregator = {};
        var heightsAggregator = {};
        var weightsAggregator = {};
        var agesAggregator = {};

        _.each(hits, function(hit) {
            if(hit._source.itemOffered) {
                var person = hit._source.itemOffered;

                nameAggregator = extractArrayField(person, nameAggregator, 'name');
                weightsAggregator = extractField(person, weightsAggregator, "schema:weight");
                heightsAggregator = extractField(person, heightsAggregator, "schema:height");

                agesAggregator = extractArrayField(person, agesAggregator, 'personAge');
            }
        });

        var people = {
            names: [],
            eyeColors: [],
            hairColors: [],
            ethnicities: [],
            heights: [],
            weights: [],
            ages: []
        };

        //resolve
        return people;
    }

    function extractArrayField(person, aggregator, field) {
        if(person[field]) {
            _.each(person[field], function(val) {
                if(aggregator[val]) {
                    aggregator[val] = aggregator[val] + 1;
                } else {
                    aggregator[val] = 1;
                }
            });
        }

        return aggregator;
    }

    function extractField(person, aggregator, field) {
        if(person[field]) {
            if(aggregator[person[field]]) {
                aggregator[person[field]] = aggregator[person[field]] + 1;
            } else {
                aggregator[person[field]] = 1;
            }
        }
    }

    function unrollAggregator(aggregator) {
        var array;



        return array;
    }

    function getOfferTitles(hits) {

    }

    function getLocations(hits) {

    }

    function getOfferDates(hits) {

    }

    return {
        email: function(data) {
            var newData = {};

            if(data.hits.hits[0]._source) {
                var hits = data.hits.hits;

                newData.emailAddress = getEmailAddress(hits[0]._source);
                newData.prices = getPrices(hits);
                newData.people = getPeople(hits);
                newData.offerTitles = getOfferTitles(hits);
                newData.locations = getLocations(hits);
                newData.offerDates = getOfferDates(hits);
            }

            return newData;
        }
    };
})(_);
