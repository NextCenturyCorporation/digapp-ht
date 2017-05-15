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
 * Polymer behavior for collections of filters such as the search facets.
 */
DigBehaviors.FilterBehavior = {
  /**
   * Returns whether all the items in the given search facets collection are disabled.
   *
   * @param {Object} facets
   * @param {Array} ignore
   * @return {Boolean}
   */
  areAllFacetsDisabled: function(facets, ignore) {
    return _.keys(facets).every(function(type) {
      if((ignore && ignore.indexOf(type) >= 0) || _.isEmpty(facets[type])) {
        return true;
      }
      return _.keys(facets[type]).every(function(term) {
        return !facets[type][term].enabled;
      });
    });
  },

  /**
   * Returns the two-element array of start and end dates from the given date search facet.  If a start or end date is not set or enabled the array will have null at that index.
   *
   * @param {Object} facet
   * @return {Array}
   */
  getFacetDates: function(facet) {
    var start = facet.dateStart && facet.dateStart.enabled ? facet.dateStart.date : null;
    var end = facet.dateEnd && facet.dateEnd.enabled ? facet.dateEnd.date : null;
    return [start, end];
  },

  /**
   * Returns the array of enabled query terms from the given search facet.
   *
   * @param {Object} facet
   * @return {Array}
   */
  getFacetTerms: function(facet) {
    return _.keys(facet).filter(function(key) {
      return facet[key].enabled;
    }).map(function(key) {
      return key;
    });
  },

  /**
   * Returns the array of query items from the given entity page filter (can be used for terms or dates).
   *
   * @param {Array} items
   * @return {Array}
   */
  getEntityPageFilterItems: function(items) {
    return items;
  }
};
