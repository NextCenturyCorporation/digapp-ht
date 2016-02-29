/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _ */
/* exported offerTransform */
var offerTransform = (function() {

    function getAddress(record) {
        /** build address object:
        "address": {
            "locality": "Los Angeles",
            "region": "California",
            "country": "US"
        }
        */
        var address = {};
        address.locality = _.get(record, 'availableAtOrFrom.address[0].addressLocality');
        address.region = _.get(record, 'availableAtOrFrom.address[0].addressRegion');
        address.country = _.get(record, 'availableAtOrFrom.address[0].addressCountry');
        return address;
    }

    function getGeolocation(record) {
        /** build geolocation object:
        "geo": { 
            "lat": 33.916403, 
            "lon": -118.352575
        }
        
        if no lat && lon, return undefined 
        */
        var geo;
        var lat = _.get(record, 'availableAtOrFrom.geo.lat');
        var lon = _.get(record, 'availableAtOrFrom.geo.lon');

        if(lat && lon) {
            geo = {};
            geo.lat = lat;
            geo.lon = lon;
        }

        return geo;
    }

    function getPerson(record) {
        /** build person object:
        "person": {
            "name": "Emily", 
            "eyeColor": "blue",
            "hairColor": "brown",
            "height": 64,
            "weight": 115,
            "age": 20
        }
        */
        var person = {};
        person.name = _.get(record, 'itemOffered.name');
        person.eyeColor = _.get(record, 'itemOffered.eyeColor');
        person.hairColor = _.get(record, 'itemOffered.hairColor');
        person.height = _.get(record, 'itemOffered[schema:height]');
        person.weight = _.get(record, 'itemOffered[schema:weight]');
        person.age = _.get(record, 'itemOffered.personAge');
        return person;
    }

    function getPrices(record) {
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

    function getEmails(record) {
        var emails = [];
        var emailArr = _.get(record, '_source.seller.email', []);
        emailArr.forEach(function(emailElem) {
            emails.push(_.get(emailElem, 'name[0]'));
        });
        return emails;
    }

    return {
        // expected data is from an elasticsearch 
        offer: function(data) {
            var newData = {};

            if(data.hits.hits[0]._source) {
                newData.date = _.get(data.hits.hits[0]._source, 'validFrom');
                newData.address = getAddress(data.hits.hits[0]._source);
                newData.geo = getGeolocation(data.hits.hits[0]._source);
                newData.person = getPerson(data.hits.hits[0]._source);
                newData.title = _.get(data.hits.hits[0]._source, 'title');
                newData.publisher = _.get(data.hits.hits[0]._source, 'mainEntityOfPage.publisher.name[0]');
                newData.body = _.get(data.hits.hits[0]._source, 'mainEntityOfPage.description[0]');
                newData.prices = getPrices(data.hits.hits[0]);
                newData.emails = getEmails(data.hits.hits[0]);
                newData.phones = getPhones(data.hits.hits[0]);
            }

            return newData;
        }
    };

})();


