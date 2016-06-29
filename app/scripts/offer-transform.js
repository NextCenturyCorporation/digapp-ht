/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported offerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var offerTransform = (function(_, commonTransforms) {

    function getGeolocation(record) {
        /** build geolocation array object:
        "geolocation": [{ 
            "latitude": 33.916403, 
            "longitude": -118.352575
        }]
        
        should only be one location, but needs to be in array format 
        to be processed by leaflet-wrapper

        if no latitude && longitude, return empty array
        */
        var geolocation = [];
        var latitude = _.get(record, 'availableAtOrFrom.address[0].geo.latitude');
        var longitude = _.get(record, 'availableAtOrFrom.address[0].geo.longitude');

        if(latitude && longitude) {
            var location = {};
            location.latitude = latitude;
            location.longitude = longitude;
            geolocation.push(location);
        }

        return geolocation;
    }

    function getPerson(record) {
        /** build person object:
        "person": {
            "name": "Emily",
            "ethnicities": ["white"],
            "height": 64,
            "weight": 115,
            "ages": [20]
        }
        */
        var person = {};
        person._id = _.get(record, 'itemOffered.uri');
        person._type = 'provider';
        person.name = _.get(record, 'itemOffered.name', 'Name N/A');
        person.ethnicities = _.get(record, 'itemOffered.ethnicity') || [];
        person.height = _.get(record, 'itemOffered.height');
        person.weight = _.get(record, 'itemOffered.weight');
        person.ages = _.get(record, 'itemOffered.age') || [];

        person.ethnicities = (_.isArray(person.ethnicities) ? person.ethnicities : [person.ethnicities]);
        person.ages = (_.isArray(person.ages) ? person.ages : [person.ages]);

        var title = (person.name !== 'Name N/A') ? person.name : '';
        var sep = (title === '') ? '' : ', ';

        if(person.ages && person.ages.length) {
            title += sep + person.ages[0];
            sep = ', ';
        }
        if(person.ethnicities && person.ethnicities.length) {
            title += sep + person.ethnicities[0];
            sep = ', ';
        }
        person.title = title;
        person.show = (title.length > 0) ? true: false;
        return person;
    }

    function getPrice(record) {
        var result = '';
        var prices = _.get(record, 'priceSpecification');
        if(prices) {
            var sep = '';
            prices.forEach(function(elem) {
                var price = elem.name;
                if(price !== '-per-min') {
                    result = result + sep + price;
                    sep = ', ';
                }
            });
        }
        return result;
    }

    function parseOffer(record) {
        var newData = {};

        newData._id = _.get(record, 'uri');
        newData.date = _.get(record, 'validFrom');
        newData.address = commonTransforms.getAddress(record);
        newData.geolocation = getGeolocation(record);
        newData.person = getPerson(record);
        newData.price = getPrice(record);
        newData.title = _.get(record, 'title', 'Title N/A');
        newData.publisher = _.get(record, 'mainEntityOfPage.publisher.name');
        newData.body = _.get(record, 'mainEntityOfPage.description');
        newData.emails = commonTransforms.getClickableObjectArr(_.get(record, 'seller.email'), 'email');
        newData.phones = commonTransforms.getClickableObjectArr(_.get(record, 'seller.telephone'), 'phone');
        newData.sellerId = _.get(record, 'seller.uri');
        newData.serviceId = _.get(record, 'itemOffered.uri');
        newData.webpageId = _.get(record, 'mainEntityOfPage.uri');
        newData.webpageUrl = _.get(record, 'mainEntityOfPage.url');
        
        return newData;
    }
    return {
        // expected data is from an elasticsearch 
        offer: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData = parseOffer(data.hits.hits[0]._source);
            }

            return newData;
        },

        revisions: function(data) {
            var newData = [];

            if(data.hits.hits.length > 0) {
                data.hits.hits.forEach(function(elem) {
                    var offer = parseOffer(elem._source);
                    offer._id = elem._id;
                    offer._type = 'offer';
                    newData.push(offer);
                });
            }

            return newData;
        },

        computeShowSeller: function(sellerPhoneEmails, webpageData) {
            var webpagePhonesLen = (webpageData.phones) ? webpageData.phones.length: 0;
            var webpageEmailsLen = (webpageData.emails) ? webpageData.emails.length: 0;

            return sellerPhoneEmails.length !== (webpageEmailsLen + webpagePhonesLen);
        }
    };

})(_, commonTransforms);
