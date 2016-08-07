/* globals DigBehaviors, _ */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for array-related utility functions.
 */
DigBehaviors.ArrayBehavior = {
  /**
   * Builds and returns an array of the non-null/non-undefined arguments.  Concatenates the array arguments.
   */
  buildArray: function() {
    var array = [];
    _.each(arguments, function(value) {
      if(_.isArray(value)) {
        value.forEach(function(innerValue) {
          if(innerValue) {
            array.push(innerValue);
          }
        });
      } else if(value) {
        array.push(value);
      }
    });
    return array;
  },

  /**
   * Builds and returns an array of the arguments if all are non-null/non-undefined; otherwise returns an empty array.  Concatenates the array arguments.
   */
  buildArrayIfAllExist: function() {
    var array = [];
    var empty = false;
    _.each(arguments, function(value) {
      if(_.isArray(value)) {
        if(!value.length) {
          empty = true;
        }
        value.forEach(function(innerValue) {
          if(innerValue) {
            array.push(innerValue);
          }
        });
      } else if(value) {
        array.push(value);
      } else {
        empty = true;
      }
    });
    return empty ? [] : array;
  }
};
