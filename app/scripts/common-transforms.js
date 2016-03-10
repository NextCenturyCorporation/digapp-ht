/**
 * Common transform functions used.
 */

/* globals _ */
/* exported commonTransforms */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var commonTransforms = (function(_) {

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
        unrollAggregator: function(aggregator, keyName) {
            var array;

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


