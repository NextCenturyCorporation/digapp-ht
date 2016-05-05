/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _ */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function() {

    function getOfferSpecificPrices(record) {
        /** build price array:
            "prices": ["250 (60 MIN)"]
        */
        var prices = [];
        var priceArr = _.get(record, '_source.priceSpecification', []);
        priceArr.forEach(function(priceElem) {
            prices.push(priceElem.price + ' (' + priceElem.billingIncrement + ' ' + priceElem.unitCode + ')');
        });
        return prices;
    }

    function getOfferSummary(record) {
        /**  build offer summary record:
            {
                "_id": "http://someuri",
                "_type": "offer",
                "title": "1234567890", // just gets first phone number
                "subtitle": "*Hello World -- google.com", // title of offer
                "details": {
                    "date": "2012-04-23T18:25:43.511Z",
                    "address": "Los Angeles", // just use locality
                    "publisher": "backpage.com",
                    "prices": ["250 (60 MIN)"]
                }
            }
        */
        var offerObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.seller.telephone[0].name[0]', 'Phone N/A'),
            subtitle: _.get(record, '_source.mainEntityOfPage.name[0]', 'Title N/A'),
            details: {
                date: _.get(record, '_source.validFrom'),
                address: _.get(record, '_source.availableAtOrFrom.address[0].addressLocality'),
                publisher: _.get(record, '_source.mainEntityOfPage.publisher.name[0]'),
                prices: getOfferSpecificPrices(record)
            }
        };

        return offerObj;
    }

    function getPhoneSummary(record) {
        /**
            build phone summary object:
            {
                "_id": "http://someuri",
                "_type": "phone",
                "title": "1234567890", // phone number
                "subtitle": "2 offer(s)" // number of offers
            }
        */
        var phoneObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.name', 'Phone N/A'),
            subtitle: _.get(record, '_source.owner[0].makesOffer.length', 0) + ' offer(s)'
        };
        return phoneObj;
    }

    function getEmailSummary(record) {
        /**
            build email summary object:
            {
                "_id": "http://someuri",
                "_type": "email",
                "title": "abc@xyz.com", // email address
                "subtitle": "2 offer(s)" // number of offers
            }
        */
        var emailObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.name', 'Email N/A'),
            subtitle: _.get(record, '_source.owner[0].makesOffer.length', 0) + ' offer(s)'
        };
        return emailObj;
    }

    function getSellerSummary(record) {
        /**
            build seller summary object:
            {
                "_id": "http://someuri",
                "_type": "seller",
                "title": "1234567890", // phone number associated with seller
                "subtitle": "2 offer(s)" // number of offers
            }
        */
        var sellerObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.telephone[0].name[0]', 'Phone N/A'),
            subtitle: _.get(record, '_source.makesOffer.length', 0) + ' offer(s)'
        };
        return sellerObj;
    }

    function getAddressArray(record) {
        /** build address array:
            "addresses": ["Los Angeles"]
        */
        var addresses = [];
        var addressesArr = _.get(record, '_source.mainEntity.availableAtOrFrom.address', []);

        addressesArr.forEach(function(addressElem) {
            var locality = _.get(addressElem, 'addressLocality');

            if(locality) {
                addresses.push(locality);
            }
        });
        return addresses;
    }

    function getWebpageSummary(record) {
        /*  build webpage summary object:
            {
                "_id": "http://someuri",
                "_type": "webpage",
                "title": "yahoo.com",   // publisher 
                "subtitle": "*Hello World -- google.com", // title of webpage
                "details": {
                    "url": "http://someurlhere.com",
                    "body": "description text here",
                    "addresses": ["Los Angeles"],
                    "date": "2012-04-23T18:25:43.511Z"
                }
            }
        */
        var webpageObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.publisher.name[0]', 'Publisher N/A'),
            subtitle: _.get(record, '_source.name[0]', 'Title N/A'),
            details: {
                url: _.get(record, '_source.url'),
                body: _.get(record, '_source.description[0]'),
                addresses: getAddressArray(record),
                date: _.get(record, '_source.dateCreated')             
            }

        };
        return webpageObj;
    }

    function getServiceSummary(record) {
        /*
            build service/person summary object:
            {
                "_id": "http://someuri",
                "_type": "person",
                "title": "Emily", // person name
                "subtitle": "Age: 20", // age
                "details": {
                    "eyeColor": "blue",
                    "hairColor": "brown",
                    "height": 64,
                    "weight": 115,
                    "ethnicity": "white"
                }
            }
        */
        var serviceObj = {
            _id: record._id,
            _type: 'person', // hardcode 'person' value for now
            title: _.get(record, '_source.name[0]', 'Name N/A'),
            subtitle: 'Age: ' + _.get(record, '_source.personAge[0]', 'N/A'),
            details: {
                eyeColor: _.get(record, '_source.eyeColor'),
                hairColor: _.get(record, '_source.hairColor'),
                height: _.get(record, '_source[schema:height]'),
                weight: _.get(record, '_source[schema:weight]'),
                ethnicity: _.get(record, '_source.ethnicity'),
            }
        };
        return serviceObj;
    }

    return {
        // expected data is from an elasticsearch query
        offer: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getOfferSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        phone: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getPhoneSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        email: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getEmailSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        seller: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getSellerSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        service: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getServiceSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        webpage: function(data) {
            var newObj = {data: [], count: 0};
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newObj.data.push(getWebpageSummary(record));
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        },
        // transform for combined sets of results not separated by type
        combinedResults: function(data) {
            var newObj = {data: [], count: 0};
            if(data && data.hits && data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    switch(record._type) {
                        case 'email': newObj.data.push(getEmailSummary(record));
                            break;
                        case 'adultservice': newObj.data.push(getServiceSummary(record));
                            break;
                        case 'phone': newObj.data.push(getPhoneSummary(record));
                            break;
                        case 'offer': newObj.data.push(getOfferSummary(record));
                            break;
                        case 'seller': newObj.data.push(getSellerSummary(record));
                            break;
                        case 'webpage': newObj.data.push(getWebpageSummary(record));
                            break;
                    }
                });
                newObj.count = data.hits.total;
            }
            return newObj;
        }
    };

})();


