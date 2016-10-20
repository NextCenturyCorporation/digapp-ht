/* globals DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for browser-related utility functions.
 */
DigBehaviors.BrowserBehavior = {
  /**
   * Returns the URL parameters from the given string.
   */
  getUrlParameters: function(parameterInput) {
    var parameters = {};
    if(parameterInput && parameterInput !== '?') {
      (parameterInput.indexOf('?') === 0 ? parameterInput.slice(1) : parameterInput).split('&').forEach(function(parameter) {
        var parameterSplit = parameter.split('=');
        parameters[parameterSplit[0]] = (parameterSplit.length > 1 ? parameterSplit[1] : true);
      });
    }
    return parameters;
  }
};
