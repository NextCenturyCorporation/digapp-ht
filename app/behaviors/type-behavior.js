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

/* globals DigBehaviors */
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

    var linkId = id;
    if(linkId.startsWith('http://dig.isi.edu/ht/data/')) {
      linkId = decodeURIComponent(linkId.substring(linkId.lastIndexOf('/') + 1));
    }
    if(type === 'email') {
      linkId = encodeURIComponent(linkId);
    }
    if(type === 'image') {
      return '/' + type + '.html?url=' + linkId;
    }
    return '/' + type + '.html?id=' + linkId;
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
      case 'review': return 'icons:thumbs-up-down';
      case 'seller': return 'icons:group-work';
      case 'service': return 'icons:work';
      case 'social': return 'social:public';
      case 'webpage': return 'av:web';
    }
    return '';
  },

  /**
   * Returns the name for the given type.
   */
  getTypeName: function(type) {
    switch(type) {
      case 'cache': return 'Cached Webpage';
      case 'date': return 'Date';
      case 'email': return 'Email Address';
      case 'image': return 'Image';
      case 'location': return 'Location';
      case 'money': return 'Price';
      case 'offer': return 'Ad';
      case 'phone': return 'Telephone Number';
      case 'provider': return 'Provider';
      case 'review': return 'Review ID';
      case 'seller': return 'Seller';
      case 'service': return 'Service Provided';
      case 'social': return 'Social Media ID';
      case 'webpage': return 'Website';
    }
    return '';
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
