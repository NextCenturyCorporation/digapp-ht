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
