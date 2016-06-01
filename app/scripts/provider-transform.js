/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported webpageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var providerTransform = (function(_, commonTransforms) {

    function getProvider(record) {
        var person = {};
        person._id = _.get(record, 'uri');
        person._type = "provider";
        person.name = _.get(record, 'name', 'Name N/A');
        person.ethnicities = _.get(record, 'ethnicity');
        person.height = _.get(record, 'height');
        person.weight = _.get(record, 'weight');
        person.ages = _.get(record, 'age');

        title = (person.name != 'Name N/A')? person.name : "";
        sep = (title == "")? "": ", ";
        if(person.ages) {
            title += sep + person.ages[0]
            sep = ", "
        }
        if(person.ethnicities) {
            title += sep + person.ethnicities[0]
            sep = ", "
        }
        person.title = title;
        person.sellers = [];
        var offers = _.get(record, 'offers')
        if(offers) {
            offers.forEach(function(offer) {
                var seller = _.get(offer, "seller");
                if(seller) {
                    person.sellers.push(_.get(seller, "uri"))
                }
            });
        }
        return person;
    }

    return {
        // expected data is from an elasticsearch 
        provider: function(data) {
            var newData = {};

            if(data.hits.hits.length > 0) {
                newData = getProvider(data.hits.hits[0]._source);
            }

            return newData;
        }
    };

})(_, commonTransforms);
