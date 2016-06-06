/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {
    return {
        // expected data is from an elasticsearch 
        seller: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData._id = _.get(data.hits.hits[0], '_id');
                newData._type = _.get(data.hits.hits[0], '_type');
                newData.telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
                newData.emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
                var title = undefined;
                var numPhoneEmails = 0;
                if(newData.telephone.length > 0) {
                    title = newData.telephone[0].title;
                    numPhoneEmails += newData.telephone.length;
                }
                if(newData.emailAddress.length > 0) {
                    if(title) {
                       title += ", " + newData.emailAddress[0].title;
                    }
                    else {
                        title = newData.emailAddress[0].title;   
                    }
                    numPhoneEmails += newData.emailAddress.length;
                }
                if(numPhoneEmails > 2) {
                    numPhoneEmails = numPhoneEmails - 2;
                    newData.title = 'Seller ' + title + ' (' + numPhoneEmails + ' more)...';
                }
                else {
                    newData.title = 'Seller (' + (title || 'Info N/A') + ')';
                }
                
                newData.subtitle = '';
            }

            return newData;
        },
        phoneEmails: function(data) {
            var newData = [];

            if(data.hits.hits.length > 0) {
                
                var telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
                var emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
                
                if(telephone && emailAddress) {
                    newData = telephone.concat(emailAddress);
                }
                else if(telephone) {
                    newData = telephone;
                }
                else if(emailAddress) {
                    newData = emailAddress;
                }
                
            }

            return newData;
        },
        offerTimelineData: function(data) {
            return commonTransforms.offerTimelineData(data);
        },
        offerLocationData: function(data) {
            return commonTransforms.offerLocationData(data);
        },
        sellerOffersData: function(data) {
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
        offerData: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0 && data.aggregations) {
                var aggs = data.aggregations;

                newData.locations = commonTransforms.getLocations(data.hits.hits);
                newData.offerDates = commonTransforms.transformBuckets(aggs.offers_by_seller.buckets, 'date', 'key_as_string');
                newData.offerCities = commonTransforms.transformBuckets(aggs.offer_locs_by_seller.buckets, 'city');
                newData.geoCoordinates = commonTransforms.getGeoCoordinates(data.hits.hits);
            }
            
            return newData;
        },
        relatedPhones: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.seller_assoc_numbers.buckets, 'number');
            }
            
            return newData;
        },
        relatedEmails: function(data) {
            var newData = {};

            if(data.aggregations) {
                var aggs = data.aggregations;
                newData = commonTransforms.transformBuckets(aggs.seller_assoc_emails.buckets, 'email');
            }
            
            return newData;
        },
        itinerary: function(data){
            
            var newData = {};
            if(data.aggregations){
                var aggs = data.aggregations;
                newData.date = commonTransforms.infoBuckets(aggs.phone.timeline.buckets,'date','city',['publisher','mentions'],{'publisher':'Info','mentions':'Email'});
            }
            return newData;
        }        
    };

})(_, relatedEntityTransform, commonTransforms);


