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
    _.keys(state).forEach(function(type) {
      state[type] = state[type].map(DigBehaviors.StateBehavior.updateLegacyId);
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
      url: config.url || {},
      website: config.website || {},
      weight: config.weight || {}
    };

    // Fix legacy IDs.
    _.keys(state).forEach(function(type) {
      if(type !== 'postingDate' && type !== 'sort') {
        _.keys(state[type]).forEach(function(term) {
          state[type][term].key = DigBehaviors.StateBehavior.updateLegacyId(state[type][term].key);
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
   * @param {Boolean} enableNetworkExpansion
   * @return {Object}
   */
  createStringField: function(key, title, aggregationField, queryField, enableNetworkExpansion) {
    return {
      key: key,
      title: title,
      aggregationField: aggregationField,
      queryField: queryField || aggregationField,
      enableNetworkExpansion: enableNetworkExpansion || false
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
  },

  /**
   * Builds and returns the network expansion parameters object.
   *
   * @return {Object}
   */
  buildNetworkParameters: function() {
    var networkParams = {
      age: false,
      city: false,
      country: false,
      description: false,
      email: false,
      ethnicity: false,
      eyeColor: false,
      gender: false,
      hairColor: false,
      height: false,
      image: false,
      location: false,
      name: false,
      phone: false,
      postingDate: false,
      price: false,
      region: false,
      review: false,
      services: false,
      social: false,
      title: false,
      url: false,
      website: false,
      weight: false
    };

    return networkParams;
  },

  getCategoryPrettyName: function(category) {
    switch(category) {
      case 'age': return 'Age of Provider';
      case 'city': return 'City';
      case 'country': return 'Country';
      case 'description': return 'Description';
      case 'email': return 'Email Address';
      case 'ethnicity': return 'Ethnicity of Provider';
      case 'eyeColor': return 'Eye Color of Provider';
      case 'gender': return 'Gender of Provider';
      case 'hairColor': return 'Hair Color of Provider';
      case 'height': return 'Height of Provider';
      case 'image': return 'Image';
      case 'location': return 'Location';
      case 'name': return 'Name of Provider';
      case 'phone': return 'Telephone Number';
      case 'price': return 'Price';
      case 'region': return 'Region';
      case 'review': return 'Review ID';
      case 'services': return 'Services Provided';
      case 'social': return 'Social Media ID';
      case 'title': return 'Title';
      case 'url': return 'URL';
      case 'website': return 'Website';
      case 'weight': return 'Weight of Provider';
    }
    return category;
  },

  buildTermsCollectionFromSearchParameters: function(searchParameters) {
    return _.keys(searchParameters).reduce(function(outputCollection, category) {
      if(category === 'postingDate') {
        if(searchParameters.postingDate.dateStart && searchParameters.postingDate.dateStart.enabled) {
          outputCollection['Date Start'] = [searchParameters.postingDate.dateStart.text];
        }
        if(searchParameters.postingDate.dateEnd && searchParameters.postingDate.dateEnd.enabled) {
          outputCollection['Date End'] = [searchParameters.postingDate.dateEnd.text];
        }
      } else {
        outputCollection[DigBehaviors.StateBehavior.getCategoryPrettyName(category)] = _.keys(searchParameters[category]).reduce(function(outputList, term) {
          if(searchParameters[category][term].enabled) {
            outputList.push(searchParameters[category][term].text);
          }
          return outputList;
        }, []);
      }

      return outputCollection;
    }, {});
  },

  buildTermsCollectionFromFilterCollection: function(filterCollection) {
    return _.keys(filterCollection).reduce(function(outputCollection, category) {
      if(category === 'dates') {
        if(_.isArray(filterCollection.dates) && filterCollection.dates.length === 2) {
          outputCollection['Date Start'] = [filterCollection.dates[0]];
          outputCollection['Date End'] = [filterCollection.dates[1]];
        }
      } else {
        // Use the map function to create a new array reference.
        outputCollection[DigBehaviors.StateBehavior.getCategoryPrettyName(category)] = filterCollection[category].map(function(term) {
          return term;
        });
      }

      return outputCollection;
    }, {});
  }
};
