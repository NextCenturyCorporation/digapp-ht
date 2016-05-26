/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var phoneTransform = (function(_, relatedEntityTransform, commonTransforms) {

    function getOffers(record) {
        offers = [];
        if(record.owner) {
            _.each(record.owner, function(item) {

                if(item.makesOffer) {
                    _.each(item.makesOffer, function(offer) {
                        offers.push(offer.uri) 
                    });
                }
            
          });
        }
        return offers;
    }

    function getSellerId(record) {
        sellerId = '';
        if(record.owner) {
            //phone will one seller 
            sellerId = record.owner[0].uri;
        }

        return sellerId;
    }

    function getTelephone(record) {
        /** build telephone object:
        'telephone': {
            '_id': 'http://someuri/1234567890'
            'number': '1234567890',
            'type': 'cell',
            'origin': 'Washington DC'
        }
        */
        var telephone = {};
        telephone._id = _.get(record, 'uri');
        telephone.number = _.get(record, 'name');
        telephone.origin = getOffers(record);
        telephone.sellerId = getSellerId(record);
        //telephone.email = _.get(record, 'owner[0].email[0].name[0]');

        return telephone;
    }

    function getGeoFromKeys(record) {
        
        var geos = [];
        _.each(record, function(key) {
            geoData = key.key.split(':');
            count = key.doc_count;
            var geo = {
                        city: geoData[0],
                        state: geoData[1],
                        country: geoData[2],
                        longitude: geoData[3],
                        latitude: geoData[4],
                        count: count,
                        name: geoData[0] + ", " + geoData[1]
                    };
            geos.push(geo)
        });
        // Removing duplicates for better map display
        //geos = _.uniqWith(geos, commonTransforms.isGeolocationEqual);
        return geos;
    }

    return {
        // expected data is from an elasticsearch 
        telephone: function(data) {
            var newData = {};
            if(data.hits.hits.length > 0) {
                newData = getTelephone(data.hits.hits[0]._source);
            }
            
            return newData;
        },
        offerTimelineData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                var aggs = data.aggregations;
                newData.offerTimeline = commonTransforms.transformBuckets(aggs.offersPhone.offerTimeline.buckets, 'date', 'key_as_string');
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
        people: function(data) {
            var newData = {};

            if(data.aggregations) {
                newData = commonTransforms.getPeople(data.aggregations);
            }
            
            return newData;
        },
        computeShowSeller: function(seller, phone) {
            sellerOut = [];
            _.each(seller, function(record) {
                if(record.title !== phone) {
                    sellerOut.push(record);
                }   
            });
            if(sellerOut.length > 0) {
                return sellerOut;    
            }
            return undefined;
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


