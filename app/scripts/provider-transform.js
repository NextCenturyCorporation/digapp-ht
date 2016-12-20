/*
 * Copyright 2017 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * transform elastic search webpage query to display format.  See data-model.json
 */

/* exported providerTransform */
/* jshint camelcase:false */

var providerTransform = (function(_, commonTransforms) {
  function getPersonObject(record) {
    var id = _.get(record, 'uri');
    if(!id) {
      return {};
    }

    var person = {
      id: id,
      type: 'provider',
      icon: commonTransforms.getIronIcon('provider'),
      link: commonTransforms.getLink(id, 'provider'),
      styleClass: commonTransforms.getStyleClass('provider'),
      names: _.get(record, 'name', []),
      ages: _.get(record, 'age', []),
      ethnicities: _.get(record, 'ethnicity', []),
      hairColors: _.get(record, 'hairColor', []),
      eyeColors: _.get(record, 'eyeColor', []),
      heights: _.get(record, 'height', []),
      weights: _.get(record, 'weight', []),
    };

    person.names = (_.isArray(person.names) ? person.names : [person.names]);
    person.ages = (_.isArray(person.ages) ? person.ages : [person.ages]);
    person.ethnicities = (_.isArray(person.ethnicities) ? person.ethnicities : [person.ethnicities]);
    person.hairColors = (_.isArray(person.hairColors) ? person.hairColors : [person.hairColors]);
    person.eyeColors = (_.isArray(person.eyeColors) ? person.eyeColors : [person.eyeColors]);
    person.heights = (_.isArray(person.heights) ? person.heights : [person.heights]);
    person.weights = (_.isArray(person.weights) ? person.weights : [person.weights]);

    var name = (person.names.length) ? [person.names[0]] : [];
    if(person.ages && person.ages.length) {
      name.push(person.ages[0]);
    }
    if(person.ethnicities && person.ethnicities.length) {
      name.push(person.ethnicities[0]);
    }
    person.name = name.length ? name.join(', ') : 'Unknown Provider';
    return person;
  }

  return {
    // expected data is from an elasticsearch
    provider: function(data) {
      if(data && data.hits.hits.length > 0) {
        return getPersonObject(_.get(data.hits.hits[0], '_source'));
      }
      return {};
    },
    personFromRecord: function(record) {
      return getPersonObject(record);
    }
  };
});
