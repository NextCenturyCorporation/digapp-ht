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

/* globals DigBehaviors, _ */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for state-related utility functions.
 */
DigBehaviors.StateBehavior = {
  updateLegacyId: function(id) {
    if(id.indexOf('http://dig.isi.edu/ht/data/email') === 0) {
      return decodeURIComponent(id.substring(id.lastIndexOf('/') + 1));
    }
    if(id.indexOf('http://dig.isi.edu/ht/data/phone') === 0) {
      var phone = id.substring(id.lastIndexOf('/') + 1);
      if(phone.indexOf('1-') === 0) {
        return phone.substring(2);
      }
      return phone;
    }
    return id;
  },

  /**
   * Builds and returns the entity state object from the given config object.
   *
   * @param {Object} config
   * @return {Object}
   */
  buildEntityState: function(config) {
    var state = {
      age: config.age || [],
      dates: config.dates || [],
      email: config.email || [],
      ethnicity: config.ethnicity || [],
      eyeColor: config.eyeColor || [],
      gender: config.gender || [],
      hairColor: config.hairColor || [],
      height: config.height || [],
      image: config.image || [],
      location: config.location || [],
      name: config.name || [],
      phone: config.phone || [],
      price: config.price || [],
      publisher: config.publisher || [],
      review: config.review || [],
      services: config.services || [],
      social: config.social || [],
      weight: config.weight || []
    };

    // Fix legacy IDs.
    var self = this;
    _.keys(state).forEach(function(type) {
      state[type] = state[type].map(self.updateLegacyId);
    });

    return state;
  },

  /**
   * Builds and returns the search state object from the given config object.
   *
   * @param {Object} config
   * @return {Object}
   */
  buildSearchState: function(config) {
    var state = {
      age: config.age || {},
      city: config.city || {},
      country: config.country || {},
      description: config.description || {},
      email: config.email || {},
      ethnicity: config.ethnicity || {},
      eyeColor: config.eyeColor || {},
      gender: config.gender || {},
      hairColor: config.hairColor || {},
      height: config.height || {},
      image: config.image || {},
      location: config.location || {},
      name: config.name || {},
      phone: config.phone || {},
      // start and end dates will be keys within postingDate
      postingDate: config.postingDate || {},
      price: config.price || {},
      region: config.region || {},
      review: config.review || {},
      services: config.services || {},
      social: config.social || {},
      title: config.title || {},
      website: config.website || {},
      weight: config.weight || {},
      sort: config.sort || ''
    };

    // Fix legacy IDs.
    var self = this;
    _.keys(state).forEach(function(type) {
      if(type !== 'postingDate' && type !== 'sort') {
        _.keys(state[type]).forEach(function(term) {
          state[type][term].key = self.updateLegacyId(state[type][term].key);
        });
      }
    });

    // Fix legacy dates.
    if(_.isEmpty(state.postingDate) && !_.isEmpty(config.dateCreated)) {
      var start = config.dateCreated['Begin Date'];
      var end = config.dateCreated['End Date'];
      state.postingDate = {
        dateEnd: (end ? {
          key: 'dateEnd',
          category: 'To',
          date: end.date,
          enabled: end.enabled,
          text: end.text
        } : undefined),
        dateStart: (start ? {
          key: 'dateStart',
          category: 'From',
          date: start.date,
          enabled: start.enabled,
          text: start.text
        } : undefined),
      };
    }

    return state;
  },

  /**
   * Creates a string configuration object based on parameters given.
   *
   * @param {String} key
   * @param {String} title
   * @param {String} aggregationField
   * @param {String} queryField
   * @return {Object}
   */
  createStringField: function(key, title, aggregationField, queryField) {
    return {
      key: key,
      title: title,
      aggregationField: aggregationField,
      queryField: queryField || aggregationField
    };
  },

  /**
   * Creates a date configuration object based on parameters given.
   *
   * @param {String} key
   * @param {String} title
   * @param {String} field
   * @param {String} dateIdentifier
   * @return {Object}
   */
  createDateField: function(key, title, field, dateIdentifier) {
    return {
      key: key,
      title: title,
      aggregationField: field,
      queryField: field,
      dateIdentifier: dateIdentifier
    };
  }
};
