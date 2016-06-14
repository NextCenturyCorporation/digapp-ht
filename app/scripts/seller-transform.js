/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {

    /**
        * Gives two level heirarchies for the aggregrations - and the thir hierarchy as just an info
        * Example filter level1 by date and level2 by city and pulblisher as info
           {
                date:[{
                    date: 1455657767
                    city:{
                        city: "Los Angeles",
                        info: '"abc.com", "rg.com"''
                    }
                },
    
           }
    */
    function infoBuckets(buckets,levelOne,levelTwo,keys,renames){
        buckets = _.reduce(buckets, function (results, bucket) {
            var objLevelOne = {};
            objLevelOne[levelOne] = bucket.key;

            if(bucket[levelTwo].buckets.length){
                objLevelOne[levelTwo] = _.map(bucket[levelTwo].buckets, function(buck){
                    var objLevelTwo = {};
                    objLevelTwo[levelTwo] = buck.key;
                    objLevelTwo.data = [];
                    
                    for(var key in keys){
                        var ele = {};
                        ele.key = keys[key];
                        
                        if(_.has(renames, ele.key ))
                            ele.key = renames[ele.key];

                        if(_.has(buck,keys[key])){
                            if(keys[key] == 'mentions'){
                                ele.value = _.map(buck[keys[key]].buckets, function(buc){
                                    return buc.key;
                                })
                                phoneAndEmail = commonTransforms.getEmailAndPhoneFromMentions(ele.value);

                                for(var argKey in phoneAndEmail){
                                    if (phoneAndEmail[argKey].length){
                                        ele = {}
                                        if(argKey=="phones")
                                            ele.key = "Phone";
                                        else if(argKey=="emails")
                                            ele.key = "Email";

                                        ele.value = _.map(phoneAndEmail[argKey], function(b){
                                            return b.title;
                                        }).join(', ');
                                        objLevelTwo.data.push(ele);
                                    }
                                }
                            }else{
                                ele.value = _.map(buck[keys[key]].buckets, function(buc){
                                    return buc.key;
                                }).join(', ');
                                objLevelTwo.data.push(ele);
                            }
                        } 
                    }
                    return objLevelTwo;
                });
                objLevelOne.id = results.length;
                results.push(objLevelOne);
            }
          return results;
        }, []);

        return buckets;
    }

<<<<<<< HEAD
    function processLocationGraph(records){
        var data = [];
        _.each(records, function(record){
            var point = {}
            point.date = new Date(record.key);

            point.value = {}
            if (record.localities.buckets){
                sum = 0;
                _.each(record.localities.buckets, function(location){
                    geoData = location.key.split(':');
                    city = geoData[0];
                    point.value[city] = location.doc_count;
                    sum+=location.doc_count;
                });
            }
            point.value['Other'] = record.doc_count - sum;
            data.push(point);
        });
        return data;
    }

    function getGeoCities(record) {

        var geos = [];
        _.each(record, function(key) {
            geoData = key.key.split(':');
            geos.push(geoData[0])
        });
        geoData.push("Other");
        return geos;
    }
    
    function getSellerTitle(phones, emails) {
      var title = '';
      var otherPhonesAndEmails = 0;
      if(phones.length > 0) {
        title = phones[0].title;
        otherPhonesAndEmails += phones.length - 1;
      }
      if(emails.length > 0) {
        title += (title ? ', ' : '') + emails[0].title;   
        otherPhonesAndEmails += emails.length - 1;
      }
      if(otherPhonesAndEmails) {
        title += ' (' + otherPhonesAndEmails + ' more)';
      }
      return title || 'Info N/A';
    }

    return {
        // expected data is from an elasticsearch 
        seller: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData._id = _.get(data.hits.hits[0], '_id');
                newData._type = _.get(data.hits.hits[0], '_type');
                newData.telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
                newData.emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
                newData.title = getSellerTitle(newData.telephone, newData.emailAddress);
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
                newData.date = infoBuckets(aggs.phone.timeline.buckets,'date','city',['publisher','mentions'],{'publisher':'Info'});
            }
            return newData;
        },
        locationTimeline: function(data){
            var newData = {};

            if(data.aggregations){
                var aggs = data.aggregations;
                newData.locations = getGeoCities(aggs.offersPhone.locations.buckets);
                newData.data = processLocationGraph(aggs.offersPhone.offerTimeline.buckets);
            }
            console.log(newData);
            return newData;
        }        
    };

})(_, relatedEntityTransform, commonTransforms);


