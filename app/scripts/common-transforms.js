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
        * Creates person aggregation based on a set of records
        */
        extractPersonField: function(person, aggregator, field) {
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
        },
        /**
        * Adds names (keyName and count) to key/value pairs.
        */
        unrollAggregator: function(aggregator, keyName) {
            var array = [];

            _.each(aggregator, function(count, key) {
                var obj = {};
                obj[keyName] = key;
                obj.count = count;
                array.push(obj);
            });

            return array;
        }

    };

})(_);


