/* globals DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for creating links in this application.
 */
DigBehaviors.CreateLinkBehavior = {
  /**
   * Returns the link to the entity page for the given item with the given type property and ID property.
   */
  createIdLink: function(item, typeProperty, idProperty) {
    return (item && item[typeProperty] && item[idProperty]) ? ('/' + item[typeProperty] + '.html?value=' + item[idProperty] + '&field=_id') : '#';
  },

  /**
   * Returns the link to the entity page for the given type and the given item with the given ID property.
   */
  createIdLinkWithType: function(type, item, idProperty) {
    return (type && item && item[idProperty]) ? ('/' + type + '.html?value=' + item[idProperty] + '&field=_id') : '#';
  },

  /**
   * Returns the link to the entity page for the given type, value, and field.
   */
  createLink: function(type, value, field) {
    return (type && value && field) ? ('/' + type + '.html?value=' + value + '&field=' + field) : '#';
  }
};
