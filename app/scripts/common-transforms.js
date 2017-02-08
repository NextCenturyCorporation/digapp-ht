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

/**
 * Common transform functions used.
 */

/* exported commonTransforms */
/* jshint camelcase:false */

var commonTransforms = (function(_, moment, typeBehavior) {

  /**
   * Returns the iron icon for the given type.
   */
  function getIronIcon(type) {
    return typeBehavior.getTypeIcon(type);
  }

  /**
   * Returns the link for the given ID and type.
   */
  function getLink(id, type) {
    return typeBehavior.getPageLink(id, type);
  }

  /**
   * Returns the style class for the given type.
   */
  function getStyleClass(type) {
    return typeBehavior.getTypeStyleClass(type);
  }

  /**
  * Changes the key/value names of buckets given from an aggregation
  * to names preferred by the user.
  */
  return {
    /**
     * Returns the string for the given date number/string in UTC format.
     */
    getDate: function(date) {
      if(date) {
        return moment.utc(new Date(date)).format('MMM D, YYYY');
      }
    },

    /**
     * Returns the iron icon for the given type.
     */
    getIronIcon: function(type) {
      return getIronIcon(type);
    },

    /**
     * Returns the link for the given ID and type.
     */
    getLink: function(id, type) {
      return getLink(id, type);
    },

    /**
     * Returns the style class for the given type.
     */
    getStyleClass: function(type) {
      return getStyleClass(type);
    }
  };
});
