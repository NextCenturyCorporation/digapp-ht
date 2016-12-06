/* globals DigBehaviors, _ */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for state-related utility functions.
 */
DigBehaviors.StateBehavior = {
  /**
   * Builds and returns the entity state object from the given config object.
   *
   * @param {Object} config
   * @return {Object}
   */
  buildEntityState: function(config) {
    return {
      location: config.location || [],
      name: config.name || [],
      age: config.age || [],
      ethnicity: config.ethnicity || [],
      eyeColor: config.eyeColor || [],
      hairColor: config.hairColor || [],
      height: config.height || [],
      weight: config.weight || []
    };
  },

  /**
   * Builds and returns the search state object for the UI from the given config object and annotations filter.
   *
   * @param {Object} config
   * @param {Object} annotationsFilter
   * @return {Object}
   */
  buildSearchStateForUI: function(config, annotationsFilter) {
    return {
      dateCreated: config.dateCreated || {},
      country: config.country || {},
      city: config.city || {},
      phone: config.phone || {},
      email: config.email || {},
      website: config.website || {},
      name: config.name || {},
      age: config.age || {},
      ethnicity: config.ethnicity || {},
      eyeColor: config.eyeColor || {},
      hairColor: config.hairColor || {},
      height: config.height || {},
      weight: config.weight || {},
      hasImage: config.hasImage || {},
      annotationsFilter: annotationsFilter ? _.cloneDeep(annotationsFilter) : {},
      sort: config.sort || '',
      text: config.text || ''
    };
  },

  /**
   * Builds and returns the search state object for elasticsearch from the given config object.
   *
   * @param {Object} config
   * @return {Object}
   */
  buildSearchStateForES: function(config) {
    return {
      dateCreated: config.dateCreated || {},
      country: config.country || {},
      city: config.city || {},
      phone: config.phone || {},
      email: config.email || {},
      website: config.website || {},
      name: config.name || {},
      age: config.age || {},
      ethnicity: config.ethnicity || {},
      eyeColor: config.eyeColor || {},
      hairColor: config.hairColor || {},
      height: config.height || {},
      weight: config.weight || {},
      hasImage: config.hasImage || {},
      sort: config.sort || '',
      text: config.text || ''
    };
  }
};
