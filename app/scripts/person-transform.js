/**
 * transform elastic search person query to display format.  See data-model.json
 */

/* globals _ */
/* exported personTransform */

var personTransform = (function(_) {
    return {
        person: function(data) {
            var newData = {};

            if(data.hits.hits[0]._source) {
                var hits = data.hits.hits;
                var source = hits[0]._source;

                newData.name = getName(source);
                newData.eyeColor = getEyeColor(source);
                newData.hairColor = getHairColor(source);
                newData.ethnicity = getEthnicity(source);
                newData.height = getHeight(source);
                newData.weight = getWeight(source);
                newData.age = getAge(source);
                newData.locations = getLocations(hits);
                newData.publishers = getPublishers(hits);
                newData.titles = getTitles(hits);
                newData.prices = getPrices(hits);
                newData.emails = getEmails(hits);
                newData.phones = getPhones(hits);
                newData.offerDates = getOfferDates(hits);
            }

            return newData;
        }
    };
})(_);
