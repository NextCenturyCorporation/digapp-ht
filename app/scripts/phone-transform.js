/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _ */
/* exported phonetransform */

/* note lodash should be defined in parent scope */
var phonetransform = (function(_) {

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

    function getPeople(aggs) {
        var people = {
            names: [
                {name: 'Emily', 'count': 14}, 
                {name: 'Erin', 'count': 12},
                {name: 'Jane', 'count': 3}
            ],
            eyeColors: [
                {color: 'blue', 'count': 7},
                {color: 'brown', 'count': 4}        
            ],
            hairColors: [{'color': 'brown', 'count': 7},
                {'color': 'brown', 'count': 4}
            ],
            ethnicities: [
                {'ethnicity': 'white', 'count': 19}
            ],
            heights: [{height: 64, count:5, unitOfMeasure: 'inches'}],
            weights: [{weight: 115, count: 5, unitOfMeasure: 'pounds'}],
            ages: [{age: 30, count: 9}]
        };
        return people;
    }

    return {
        // expected data is from an elasticsearch 
        transform: function(data) {
            var newData = {};

            newData.telephone = getTelephone(data.hits.hits[0]._source);

            newData.prices = getPrices(data.hits.hits);
            newData.people = getPeople(data.aggregations);
            return newData;
        }
    };

})(_);


