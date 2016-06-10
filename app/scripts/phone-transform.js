/**
 * transform elastic search phone query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported phoneTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var phoneTransform = (function(_, relatedEntityTransform, commonTransforms) {

    function getOffers(record) {
        var offers = [];
        if(record.owner) {
            _.each(record.owner, function(item) {

                if(item.makesOffer) {
                    _.each(item.makesOffer, function(offer) {
                        offers.push(offer.uri);
                    });
                }
            
          });
        }
        return offers;
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
        telephone.sellerId = commonTransforms.getSellerId(record);
        //telephone.email = _.get(record, 'owner[0].email[0].name[0]');

        return telephone;
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
            return commonTransforms.offerTimelineData(data);
        },
        offerLocationData: function(data) {
            return commonTransforms.offerLocationData(data);
        },
        phoneOffersData: function(data) {
            var newData = {};
            newData.relatedOffers = relatedEntityTransform.offer(data); 
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
            var sellerOut = [];
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


