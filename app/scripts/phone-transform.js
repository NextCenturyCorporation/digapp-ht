/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _ */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var phoneTransform = (function(_) {

    function getTelephone(record) {
        /** build telephone object:
        'telephone': {
        'number': '1234567890',
        'type': 'cell',
        'origin': 'Washington, DC'
        }
        */
        var telephone = {};
        telephone.number = _.get(record, 'seller.telephone[0].name[0]');
        telephone.type = 'cell';
        telephone.origin = 'Washington, DC';
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
            var obj = {age: elem.key, count: elem.doc_count};
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

    function getLocations(records) {
        return [];
    }

    function getOfferTitles(records) {
        return [];
    }

    function getOfferDates(aggs) {
        return [];
    }

    function getOfferCities(argument) {
        return [];
    }

    function getRelatedPhones(argument) {
        return [];
    }

    function getRelatedEmails(argument) {
        return [];
    }

    function getRelatedWebsites(aggs) {
        return [];
    }

    return {
        // expected data is from an elasticsearch 
        phone: function(data) {
            var newData = {};

            newData.telephone = getTelephone(data.hits.hits[0]._source);
            newData.prices = getPrices(data.hits.hits);
            newData.people = getPeople(data.aggregations);
            newData.locations = getLocations(data.hits.hits);
            newData.offerTitles = getOfferTitles(data.hits.hits);
            newData.offerDates = getOfferDates(data.aggregations);
            newData.offerCities = getOfferCities(data.aggregations);
            newData.relatedPhones = getRelatedPhones(data.aggregations);
            newData.relatedEmails = getRelatedEmails(data.aggregations);
            newData.relatedWebsites = getRelatedWebsites(data.aggregations);

            return newData;
        }
    };

})(_);


