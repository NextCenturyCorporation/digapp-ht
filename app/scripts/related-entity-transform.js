/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _ */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function() {

    function getOfferSpecificPrices(record) {
        /** build price array:

            "prices": [{
                "amount": 250, 
                "unitCode": "MIN", 
                "billingIncrement": 60, 
                "date": "2012-04-23T18:25:43.511Z"
            }]
        */
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
        /** build phone array:
            "phones": ["1234567890", "0123456789"] */
        var phones = [];
        var phoneArr = _.get(record, '_source.seller.telephone', []);
        phoneArr.forEach(function(phoneElem) {
            phones.push(_.get(phoneElem, 'name[0]'));
        });
        return phones;
    }

    function getOfferSummaries(records) {
        /**  build offer summary array:
            "offer": [{
                "_id": "1",
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
            }]
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
                title: _.get(record, '_source.mainEntityOfPage.name[0]', 'Title N/A'),
                publisher: _.get(record, '_source.mainEntityOfPage.publisher.name[0]'),
                prices: getOfferSpecificPrices(record),
                phones: getPhones(record)
            };

            if(obj.phones.length === 0) {
                obj.phones.push('Phones N/A');
            }

            relatedOffers.push(obj);
        });
        return relatedOffers;
    }

    function getPhoneSummaries(records) {
        /**
            build phone summary array:
            "phone": [{
                "_id": "1",
                "_type": "phone",
                "phone": "1234567890",
                "numOffers": 2
            }]
        */
        var relatedPhones = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                phone: _.get(record, '_source.name[0]', 'Phone N/A'),
                numOffers: _.get(record, '_source.owner.length', 0)
            };
            relatedPhones.push(obj);
        });
        return relatedPhones;
    }

    function getEmailSummaries(records) {
        /**
            build email summary array:
            "email": [{
                "_id": "1",
                "_type": "email",
                "email": "abc@xyz.com",
                "numOffers": 2
            }]
        */
        var relatedEmails = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                email: _.get(record, '_source.name[0]', 'Email N/A'),
                numOffers: _.get(record, '_source.owner.length', 0)
            };
            relatedEmails.push(obj);
        });
        return relatedEmails;
    }

    function getSellerSummaries(records) {
        /**
            build seller summary array:
            "seller": [{
                "_id": "1",
                "_type": "seller",
                "phone": "1234567890",
                "numOffers": 2
            }]
        */
        var relatedSellers = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                phone: _.get(record, '_source.telephone[0].name[0]', 'Phone N/A'),
                numOffers: _.get(record, '_source.makesOffer.length', 0)
            };
            relatedSellers.push(obj);
        });
        return relatedSellers;
    }

    function getAddressArray(record) {
        /** build address array:
            "addresses": [{
                "country": "United States",
                "locality": "Los Angeles",
                "region": "California"
            }]
        */
        var addresses = [];
        var addressesArr = _.get(record, '_source.mainEntity.availableAtOrFrom.address', []);

        addressesArr.forEach(function(addressElem) {
            var obj = {
                locality: _.get(addressElem, 'addressLocality'),
                region: _.get(addressElem, 'addressRegion'),
                country: _.get(addressElem, 'addressCountry')
            };
            addresses.push(obj);
        });
        return addresses;
    }

    function getWebpageSummaries(records) {
        /*  build webpage summary array:
            "webpage": [{
                "_id": "1",
                "_type": "webpage",
                "title": "*Hello World -- google.com",
                "publisher": "yahoo.com",
                "url": "http://someurlhere.com",
                "body": "description text here",
                "addresses": [{
                    "country": "United States",
                    "locality": "Los Angeles",
                    "region": "California"
                }],
                "date": "2012-04-23T18:25:43.511Z"
            }]
        */
        var relatedWebpages = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                title: _.get(record, '_source.name[0]', 'Title N/A'),
                publisher: _.get(record, '_source.publisher.name[0]', 'Publisher N/A'),
                url: _.get(record, '_source.url'),
                body: _.get(record, '_source.description[0]'),
                addresses: getAddressArray(record),
                date: _.get(record, '_source.dateCreated')
            };
            relatedWebpages.push(obj);
        });
        return relatedWebpages;
    }

    function getServiceSummaries(records) {
        /*
            build service summary array:
            "service": [{
                "_id": "1",
                "_type": "service",
                "person": {
                    "name": "Emily", 
                    "eyeColor": "blue",
                    "hairColor": "brown",
                    "height": 64,
                    "weight": 115,
                    "ethnicity": "white",
                    "age": 20
                }
            }]
        */
        var relatedServices = [];
        records.forEach(function(record) {
            var obj = {
                _id: record._id,
                _type: record._type,
                person: {
                    name: _.get(record, '_source.name', 'Name N/A'),
                    eyeColor: _.get(record, '_source.eyeColor'),
                    hairColor: _.get(record, '_source.hairColor'),
                    height: _.get(record, '_source[schema:height]'),
                    weight: _.get(record, '_source[schema:weight]'),
                    ethnicity: _.get(record, '_source.ethnicity'),
                    age: _.get(record, '_source.personAge[0]')                    
                }
            };
            relatedServices.push(obj);
        });
        return relatedServices;
    }

    return {
        // expected data is from an elasticsearch query
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


