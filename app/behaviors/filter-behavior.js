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
 * Polymer behavior for collections of filters such as the search parameters.
 */
DigBehaviors.FilterBehavior = {
  /**
   * Returns whether the all the items in the given filter collection are disabled.
   */
  areAllDisabled: function(collection, ignore) {
    return _.keys(collection).every(function(type) {
      if((ignore && ignore.indexOf(type) >= 0) || _.isEmpty(collection[type])) {
        return true;
      }
      return _.keys(collection[type]).every(function(term) {
        return !collection[type][term].enabled;
      });
    });
  }
};
