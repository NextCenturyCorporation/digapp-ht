/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _ */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function() {

    function getOfferSpecificPrices(record) {
        var prices = [];
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
        return prices;
    }

    function getPhones(record) {
        var phones = [];
        var phoneArr = _.get(record, '_source.seller.telephone', []);
        phoneArr.forEach(function(phoneElem) {
            phones.push(_.get(phoneElem, 'name[0]'));
        });
        return phones;
    }

    function getOfferSummaries(records) {
        /*
            "offer": {
                "_id": 1,
                "_type": "offer",
                "date": "2012-04-23T18:25:43.511Z",
                "address": {
                    "country": "United States",
                    "locality": "Los Angeles",
                    "region": "California"
                },
                "publisher": "backpage.com",
                "title": "*Hello World -- google.com",
                "prices": [{
                    "amount": 250, 
                    "unitCode": "MIN", 
                    "billingIncrement": 60, 
                    "date": "2012-04-23T18:25:43.511Z"
                }],
                "phones": ["1234567890", "0123456789"]
            }
        */
        var relatedOffers = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                date: _.get(record, '_source.validFrom'),
                address: {
                    locality: _.get(record, '_source.availableAtOrFrom.address[0].addressLocality'),
                    region: _.get(record, '_source.availableAtOrFrom.address[0].addressRegion'),
                    country: _.get(record, '_source.availableAtOrFrom.address[0].addressCountry')
                },
                title: _.get(record, '_source.mainEntityOfPage.name[0]'),
                publisher: _.get(record, '_source.mainEntityOfPage.publisher.name[0]'),
                prices: getOfferSpecificPrices(record),
                phones: getPhones(record)
            };
            relatedOffers.push(obj);
        });
        return relatedOffers;
    }

    function getPhoneSummaries(records) {
        var relatedPhones = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                phone: _.get(record, '_source.name[0]'),
                numOffers: _.get(record, '_source.owner.length')
            };
            relatedPhones.push(obj);
        });
        return relatedPhones;
    }

    function getEmailSummaries(records) {
        var relatedEmails = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                email: _.get(record, '_source.name[0]'),
                numOffers: _.get(record, '_source.owner.length')
            };
            relatedEmails.push(obj);
        });
        return relatedEmails;
    }

    function getSellerSummaries(records) {
        var relatedSellers = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                phone: _.get(record, '_source.telephone[0].name'),
                numOffers: _.get(record, '_source.makesOffer.length')
            };
            relatedSellers.push(obj);
        });
        return relatedSellers;
    }

    function getWebpageSummaries(records) {
        var relatedWebpages = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type
            };
            relatedWebpages.push(obj);
        });
        return relatedWebpages;
    }

    function getServiceSummaries(records) {
        var relatedServices = [];
        records.forEach(function(record) {
            console.log(record);
            var obj = {
                _id: record._id,
                _type: record._type,
                person: {
                    name: _.get(record, '_source.name'),
                    eyeColor: _.get(record, '_source.eyeColor'),
                    hairColor: _.get(record, '_source.hairColor'),
                    height: _.get(record, '_.source[schema:height]'),
                    weight: _.get(record, '_.source[schema:weight]'),
                    ethnicity: _.get(record, '_source.ethnicity'),
                    age: _.get(record, '_source.personAge[0]')                    
                }
            };
            relatedServices.push(obj);
        });
        return relatedServices;
    }

    return {
        // expected data is from an elasticsearch 
        offer: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getOfferSummaries(data.hits.hits);
            }

            return newData;
        },
        phone: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getPhoneSummaries(data.hits.hits);
            }

            return newData;
        },
        email: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getEmailSummaries(data.hits.hits);
            }
            return newData;
        },
        seller: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getSellerSummaries(data.hits.hits);
            }
            return newData;
        },
        service: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getServiceSummaries(data.hits.hits);
            }
            return newData;
        },
        webpage: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                newData = getWebpageSummaries(data.hits.hits);
            }
            return newData;
        }
    };

})();


