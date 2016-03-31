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

    function getOfferSummary(record) {
        /**  build offer summary record:
            {
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
            }
        */
        var offerObj = {
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

        if(offerObj.phones.length === 0) {
            offerObj.phones.push('Phones N/A');
        }
        return offerObj;
    }

    function getPhoneSummary(record) {
        /**
            build phone summary object:
            {
                "_id": "1",
                "_type": "phone",
                "phone": "1234567890",
                "numOffers": 2
            }
        */
        var phoneObj = {
            _id: record._id,
            _type: record._type,
            phone: _.get(record, '_source.name[0]', 'Phone N/A'),
            numOffers: _.get(record, '_source.owner.length', 0)
        };
        return phoneObj;
    }

    function getEmailSummary(record) {
        /**
            build email summary object:
            {
                "_id": "1",
                "_type": "email",
                "email": "abc@xyz.com",
                "numOffers": 2
            }
        */
        var emailObj = {
            _id: record._id,
            _type: record._type,
            email: _.get(record, '_source.name[0]', 'Email N/A'),
            numOffers: _.get(record, '_source.owner.length', 0)
        };
        return emailObj;
    }

    function getSellerSummary(record) {
        /**
            build seller summary object:
            {
                "_id": "1",
                "_type": "seller",
                "phone": "1234567890",
                "numOffers": 2
            }
        */
        var sellerObj = {
            _id: record._id,
            _type: record._type,
            phone: _.get(record, '_source.telephone[0].name[0]', 'Phone N/A'),
            numOffers: _.get(record, '_source.makesOffer.length', 0)
        };
        return sellerObj;
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

    function getWebpageSummary(record) {
        /*  build webpage summary object:
            {
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
            }
        */
        var webpageObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.name[0]', 'Title N/A'),
            publisher: _.get(record, '_source.publisher.name[0]', 'Publisher N/A'),
            url: _.get(record, '_source.url'),
            body: _.get(record, '_source.description[0]'),
            addresses: getAddressArray(record),
            date: _.get(record, '_source.dateCreated')
        };
        return webpageObj;
    }

    function getServiceSummary(record) {
        /*
            build service summary object:
            {
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
            }
        */
        var serviceObj = {
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
        return serviceObj;
    }

    return {
        // expected data is from an elasticsearch query
        offer: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getOfferSummary(record));
                });
            }
            return newData;
        },
        phone: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getPhoneSummary(record));
                });
            }
            return newData;
        },
        email: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getEmailSummary(record));
                });
            }
            return newData;
        },
        seller: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getSellerSummary(record));
                });
            }
            return newData;
        },
        service: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getServiceSummary(record));
                });
            }
            return newData;
        },
        webpage: function(data) {
            var newData = [];
            if(data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    newData.push(getWebpageSummary(record));
                });
            }
            return newData;
        },
        results: function(data) {
            var newData = [];
            if(data && data.hits && data.hits.hits.length > 0) {
                // TODO: generalize output
                _.each(data.hits.hits, function(record) {
                    switch(record._type) {
                        case 'email': newData.push(getEmailSummary(record));
                            break;
                        case 'adultservice': newData.push(getServiceSummary(record));
                            break;
                        case 'phone': newData.push(getPhoneSummary(record));
                            break;
                        case 'offer': newData.push(getOfferSummary(record));
                            break;
                        case 'seller': newData.push(getSellerSummary(record));
                            break;
                        case 'webpage': newData.push(getWebpageSummary(record));
                            break;
                    }
                });
            }
            console.log(newData);
            return newData;
        }
    };

})();


