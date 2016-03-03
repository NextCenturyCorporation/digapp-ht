/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* globals _ */
/* exported webpageTransform */

var webpageTransform = (function(_) {
    return {
        webpage: function(data) {
            var newData = {};

            if(data.hits.hits[0]._source) {
                var source = data.hits.hits[0]._source;

                newData.date = getDate(source);
                newData.address = getAddress(source);
                newData.geo = getGeoLocation(source);
                newData.person = getPerson(source);
                newData.publisher = getPublisher(source);
                newData.title = getTitle(source);
                newData.body = getBody(source);
                newData.price = getPrice(source);
                newData.emails = getEmails(source);
                newData.phones = getPhones(source);
                newData.validFrom = getValidFrom(source);
            }

            return newData;
        }
    };
})(_);
