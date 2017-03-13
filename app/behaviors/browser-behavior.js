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

/* globals _, DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for browser-related utility functions.
 */
DigBehaviors.BrowserBehavior = {
  /**
   * Returns the page link using the given window.location object with the given state parameter string.
   */
  generateLinkWithStateParameter: function(location, state) {
    var parameters = this.getUrlParameters(location.search);
    if(state) {
      parameters.state = state;
    } else {
      delete parameters.state;
    }
    var parameterStrings = _.keys(parameters).map(function(key) {
      return key + '=' + parameters[key];
    });
    return location.protocol + '//' + location.host + location.pathname + (parameterStrings.length ? '?' + parameterStrings.join('&') : '');
  },

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
  },

  /**
   * Removes the state parameter from the browser URL using the given window.history and window.location objects.
   */
  removeStateParameter: function(/*history, location*/) {
    //var link = this.generateLinkWithStateParameter(location);
    // Update the browser URL without reloading the page.
    //history.pushState({}, '', link);
  }
};
