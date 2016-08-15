/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported providerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var providerTransform = (function(_, commonTransforms) {

  function getProvider(record) {
    var person = {};
    person.id = _.get(record, 'uri');
    person.type = 'provider';
    person.icon = commonTransforms.getIronIcon('provider');
    person.styleClass = commonTransforms.getStyleClass('provider');
    person.name = _.get(record, 'name', 'Name N/A');
    person.ethnicities = _.get(record, 'ethnicity');
    person.height = _.get(record, 'height');
    person.weight = _.get(record, 'weight');
    person.ages = _.get(record, 'age');

    var text = (person.name !== 'Name N/A') ? person.name : '';
    if(person.ages) {
      text += (text ? ', ' : '') + (_.isArray(person.ages) ? person.ages[0] : person.ages);
    }
    if(person.ethnicities) {
      text += (text ? ', ' : '') + (_.isArray(person.ethnicities) ? person.ethnicities[0] : person.ethnicities);
    }
    person.text = text;
    person.sellers = [];
    var offers = _.get(record, 'offers');
    if(offers) {
      (_.isArray(offers) ? offers : [offers]).forEach(function(offer) {
        var seller = _.get(offer, 'seller');
        if(seller) {
          person.sellers.push(_.get(seller, 'uri'));
        }
      });
    }
    return person;
  }

  return {
    // expected data is from an elasticsearch
    provider: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData = getProvider(data.hits.hits[0]._source);
      }

      return newData;
    }
  };
})(_, commonTransforms);
