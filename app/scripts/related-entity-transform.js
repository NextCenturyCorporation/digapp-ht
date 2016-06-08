/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _, commonTransforms, dateFormat */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function(_, commonTransforms, dateFormat) {

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
                    "publisher": "backpage.com"
                }
            }
        */
        var validFromDateString = _.get(record, '_source.validFrom');
        var validFromDate = undefined;
        if(validFromDateString) {
             validFromDate = dateFormat(new Date(validFromDateString), "mmmm dd, yyyy");
        }
        var datePhoneEmail = [];
        if(validFromDate) {
            datePhoneEmail.push(validFromDate);
        }
        var mentions = _.get(record, '_source.mainEntityOfPage.mentions');

        if (mentions) {
            var phones = commonTransforms.getEmailAndPhoneFromMentions(mentions).phones;
            var emails = commonTransforms.getEmailAndPhoneFromMentions(mentions).emails;
            if(phones && phones.length > 0 && emails && emails.length > 0) {
                //get only first phone and email to show in the subtitle
                datePhoneEmail.push(phones[0].title);
                datePhoneEmail.push(emails[0].title);
            }
            else if(phones && phones.length > 0) {
                //get only first phone to show in title
                datePhoneEmail.push(phones[0].title);
            }
            else if(emails && emails.length > 0) {
                //get only first email to show in title
                datePhoneEmail.push(emails[0].title);
            }
        }

        

        var offerObj = {
            _id: record._id,
            _type: record._type,
            subtitle: datePhoneEmail,
            title: _.get(record, '_source.mainEntityOfPage.name', 'Title N/A'),
            details: {
                description: _.get(record, '_source.mainEntityOfPage.description'),
                address: _.get(record, '_source.availableAtOrFrom.address[0].addressLocality'),
                publisher: _.get(record, '_source.mainEntityOfPage.publisher.name')
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
            subtitle: ''
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
            subtitle: ''
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
            title: _.get(record, '_source.telephone.name', 'Phone N/A'),
            subtitle: ''
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
            var region = _.get(addressElem, 'addressRegion');
            var country = _.get(addressElem, 'addressCountry');

            if(locality) {
                var address = locality + ', ' + region + ', ' + country;
                addresses.push(address);
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
                    """if phone exists"""
                    "phone": "<phonenumber>",
                    """if email exists"""
                    "email": "<email>"
                    "date": "2012-04-23T18:25:43.511Z"
                }
            }
        */
        var webpageObj = {
            _id: record._id,
            _type: record._type,
            title: _.get(record, '_source.name', 'Title N/A'),
            subtitle: [_.get(record, '_source.publisher.name', 'Publisher N/A')],
            offer: _.get(record, '_source.mainEntity.uri'),
            details: {
                url: _.get(record, '_source.url'),
                body: _.get(record, '_source.description'),
                addresses: getAddressArray(record),
                _sortedKeys: ['url', 'body', 'addresses', 'phone', 'email', 'date']
            }

        };
        var mentions = _.get(record, '_source.mentions');
        if(mentions) {
            phoneEmails = commonTransforms.getEmailAndPhoneFromMentions(mentions);
            if(phoneEmails.phones.length > 0) {
                var sep = "";
                phones = "";
                phoneEmails.phones.forEach(function(phoneObj) {
                    phones += sep + phoneObj.title;
                    sep = ", ";
                });
                webpageObj.details.phone = phones;
            }
            if(phoneEmails.emails.length > 0) {
                var sep = "";
                emails = "";
                phoneEmails.emails.forEach(function(emailObj) {
                    emails += sep + emailObj.title;
                    sep = ", ";
                });
                webpageObj.details.email = emails;
            }
        }

        var xDate = _.get(record, '_source.dateCreated');
        webpageObj.details.date = dateFormat(new Date(xDate), "mmmm dd, yyyy");

        webpageObj.subtitle.push(webpageObj.details.date)
        if(webpageObj.details.phone)
            webpageObj.subtitle.push(webpageObj.details.phone)
        if(webpageObj.details.email)
            webpageObj.subtitle.push(webpageObj.details.email)
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
                    "height": 64,
                    "weight": 115,
                    "ethnicity": "white"
                }
            }
        */
        var serviceObj = {
            _id: record._id,
            _type: 'person', // hardcode 'person' value for now
            title: _.get(record, '_source.name', 'Name N/A'),
            subtitle: 'Age: ' + _.get(record, '_source.age', 'N/A'),
            details: {
                height: _.get(record, '_source.height'),
                weight: _.get(record, '_source.weight'),
                ethnicity: _.get(record, '_source.ethnicity'),
            }
        };
        return serviceObj;
    }

    function getNameFromUri(uri, type) {
        var idx = uri.lastIndexOf("/")
        var text = uri.substring(idx+1)
        var countryCode = '';
        if (type === 'phone') {
            if(text.indexOf('-') !== -1) {
                var idx2 = text.indexOf('-');
                text = text.substring(idx2+1);
                var cc = text.substring(0,idx2);
                if (cc.length < 5) {
                    countryCode = cc;
                }
            }
        }
        return text;
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
            if(data && data.hits.hits.length > 0) {
                _.each(data.hits.hits, function(record) {
                    var webpageSummary = getWebpageSummary(record);
                    //We do not want to show webpage page, but instead direct
                    //to offer. The below handles that.
                    if(webpageSummary.offer) {
                        webpageSummary._type = "offer";
                        webpageSummary._id = webpageSummary.offer;
                    }
                    newObj.data.push(webpageSummary);
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
        },
        cityResults: function(data) {
            var newObject = {};

           if(data && data.aggregations && data.aggregations.webpageCityAgg && data.aggregations.webpageCityAgg.webpageCityAgg.buckets) {
                newObject.aggregations = {};
                newObject.aggregations.webpageCityAgg = {};
                newObject.aggregations.webpageCityAgg.webpageCityAgg = {};
                newObject.aggregations.webpageCityAgg.webpageCityAgg.buckets = [];
                _.each(data.aggregations.webpageCityAgg.webpageCityAgg.buckets, function(record) {

                    var newObj = {};
                    newObj.key = record.key;
                    var keys = record.key.split(':');
                    newObj.text = keys[0];
                    newObj.doc_count = record.doc_count;
                    
                    newObject.aggregations.webpageCityAgg.webpageCityAgg.buckets.push(newObj);
                });
            }
            return newObject;
        },
        mentionsPhoneResults: function(data) {
            var newObject = {};
            if(data && data.aggregations && data.aggregations.phoneAgg && data.aggregations.phoneAgg.phoneAgg.buckets) {
                newObject.aggregations = {};
                newObject.aggregations.phoneAgg = {};
                newObject.aggregations.phoneAgg.phoneAgg = {};
                newObject.aggregations.phoneAgg.phoneAgg.buckets = [];
                _.each(data.aggregations.phoneAgg.phoneAgg.buckets, function(record) {
                    if(record.key.indexOf('phone') != -1) {
                        var newObj = {};
                        newObj.key = record.key;
                        newObj.text = getNameFromUri(record.key, 'phone');
                        newObj.doc_count = record.doc_count;
                        newObject.aggregations.phoneAgg.phoneAgg.buckets.push(newObj);
                }
                });
            }
         return newObject;   
        }
    };

})(_, commonTransforms, dateFormat);


