/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* exported providerTransform */
/* jshint camelcase:false */

var providerTransform = (function(_, commonTransforms) {
  return {
    // expected data is from an elasticsearch
    provider: function(data) {
      var person = {};

      if(data && data.hits.hits.length > 0) {
        person.id = _.get(data.hits.hits[0], '_source.uri');
        person.type = 'provider';
        person.icon = commonTransforms.getIronIcon('provider');
        person.styleClass = commonTransforms.getStyleClass('provider');
        person.name = _.get(data.hits.hits[0], '_source.name', 'No Name');
        person.ethnicities = _.get(data.hits.hits[0], '_source.ethnicity');
        person.height = _.get(data.hits.hits[0], '_source.height');
        person.weight = _.get(data.hits.hits[0], '_source.weight');
        person.ages = _.get(data.hits.hits[0], '_source.age');

        var text = (person.name !== 'No Name') ? person.name : '';
        if(person.ages) {
          text += (text ? ', ' : '') + (_.isArray(person.ages) ? person.ages[0] : person.ages);
        }
        if(person.ethnicities) {
          text += (text ? ', ' : '') + (_.isArray(person.ethnicities) ? person.ethnicities[0] : person.ethnicities);
        }
        person.text = text;
      }

      return person;
    }
  };
});
