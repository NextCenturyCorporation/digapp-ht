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
 * Polymer behavior for DIG data type-specific utility functions.
 */
DigBehaviors.TypeBehavior = {
  /**
   * Returns the link for the given type and id.
   */
  getPageLink: function(id, type) {
    if(!id || !type || !(type === 'cache' || type === 'email' || type === 'image' || type === 'offer' || type === 'phone' || type === 'provider' || type === 'seller' || type === 'location')) {
      return undefined;
    }
    return '/' + type + '.html?id=' + id;
  },

  /**
   * Returns the iron icon string for the given type.
   */
  getTypeIcon: function(type) {
    switch(type) {
      case 'cache': return 'icons:cached';
      case 'date': return 'icons:date-range';
      case 'email': return 'communication:email';
      case 'image': return 'image:photo';
      case 'location': return 'communication:location-on';
      case 'money': return 'editor:attach-money';
      case 'offer': return 'maps:local-offer';
      case 'phone': return 'communication:phone';
      case 'provider': return 'icons:account-circle';
      case 'seller': return 'icons:group-work';
      case 'webpage': return 'av:web';
    }
    return 'icons:polymer';
  },

  /**
   * Returns the style class for the given type.
   */
  getTypeStyleClass: function(type) {
    if(!type) {
      return '';
    }
    return 'entity-' + type + '-font';
  }
};
