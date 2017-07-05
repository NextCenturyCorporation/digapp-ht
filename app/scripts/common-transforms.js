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
   * Returns the pretty name for the given type.
   */
  function getName(type, plural) {
    return typeBehavior.getTypeName(type, plural);
  }

  /**
   * Returns the style class for the given type.
   */
  function getStyleClass(type) {
    return typeBehavior.getTypeStyleClass(type);
  }

  /**
   * Returns the extraction database type for the given UI type.
   */
  function getDatabaseTypeFromUiType(type) {
    switch(type) {
      case 'date': return 'posting_date';
      case 'eyeColor': return 'eye_color';
      case 'hairColor': return 'hair_color';
      case 'image': return '';
      case 'location': return 'city';
      case 'postingDate': return 'posting_date';
      case 'region': return 'state';
      case 'review': return 'review_id';
      case 'services': return 'service';
      case 'social': return 'social_media_id';
    }
    return type;
  }

  /**
   * Returns the extraction UI type for the given database type.
   */
  function getUiTypeFromDatabaseType(type) {
    switch(type) {
      case 'city': return 'location';
      case 'country': return 'location';
      case 'eye_color': return 'eyeColor';
      case 'hair_color': return 'hairColor';
      case 'posting_date': return 'date';
      case 'review_id': return 'review';
      case 'service': return 'services';
      case 'state': return 'location';
      case 'social_media_id': return 'social';
    }
    return type;
  }

  /**
   * Returns the text for the given unit.
   */
  function getUnit(unit) {
    if(unit === 'foot/inch') {
      return '';
    }
    if(unit === 'centimeter') {
      return 'cm';
    }
    if(unit === 'pound') {
      return 'lbs';
    }
    return unit;
  }

  /**
   * Returns the extraction data from the given compound ID formatted as text-key1:value1-key2:value2-key3:value3...
   */
  function getExtractionDataFromCompoundId(id) {
    var idData = id ? id.split('-') : [];

    var extractionData = {
      id: idData.length ? idData[0] : undefined,
      text: idData.length ? idData[0] : undefined
    };

    if(idData.length < 2) {
      return extractionData;
    }

    var currency;
    var timeUnit;
    var site;
    var unit;

    for(var i = 1; i < idData.length; ++i) {
      if(idData[i].indexOf('unit:') === 0) {
        unit = getUnit(idData[i].split(':')[1]);
      }
      if(idData[i].indexOf('site:') === 0) {
        site = getUnit(idData[i].split(':')[1]);
      }
      if(idData[i].indexOf('time_unit:') === 0) {
        timeUnit = idData[i].split(':')[1];
      }
      if(idData[i].indexOf('currency:') === 0) {
        currency = idData[i].split(':')[1];
      }
    }

    if(unit) {
      extractionData.text = extractionData.text + ' ' + unit;
    }

    if(site) {
      extractionData.text = extractionData.text + ' (' + site + ')';
    }

    if(timeUnit || currency) {
      extractionData.text = extractionData.text + (currency ? ' ' + currency : '') + (timeUnit ? ' per ' + timeUnit + ' minutes' : '');
    }

    return extractionData;
  }

  /**
   * Returns the formatted telephone number.
   */
  function getFormattedPhone(phone) {
    var output = phone;
    // Remove United States or X country code.
    output = (output.indexOf('+1-') === 0 ? output.substring(output.indexOf('+1-') + 3) : output);
    output = (output.indexOf('+x-') === 0 ? output.substring(output.indexOf('+x-') + 3) : output);
    return output.replace(/(\d{0,4})-?(\d{3})(\d{3})(\d{4})/, function(match, p1, p2, p3, p4) {
      if(p2 && p3 && p4) {
        return (p1 ? p1 + '-' : '') + p2 + '-' + p3 + '-' + p4;
      }
      return p1 + p2 + p3 + p4;
    });
  }

  /**
   * Returns the location data from the given ID formatted as city:state:country:longitude:latitude.
   */
  function getLocationDataFromId(id) {
    var idData = id ? id.split(':') : [];

    // TODO We should return an empty object if the ID is formatted incorrectly once the extractions are improved.
    if(idData.length < 5) {
      return {
        city: id,
        text: id + ' (Bad Format)'
      };
    }

    var city = idData[0];
    var state = idData.length > 1 ? idData[1] : undefined;
    var country = idData.length > 2 ? idData[2] : undefined;
    var longitude = idData.length > 3 ? idData[3] : undefined;
    var latitude = idData.length > 4 ? idData[4] : undefined;
    var text = city ? (city + (state ? (', ' + state) : '')) : 'Unknown Location';

    return {
      city: city,
      country: country,
      latitude: latitude,
      longitude: longitude,
      state: state,
      text: text
    };
  }

  function isGoodLocation(location) {
    return location.latitude && location.longitude && location.text;
  }

  /**
  * Changes the key/value names of buckets given from an aggregation
  * to names preferred by the user.
  */
  return {
    /**
     * Returns the extraction database type for the given UI type.
     */
    getDatabaseTypeFromUiType: function(type) {
      return getDatabaseTypeFromUiType(type);
    },

    /**
     * Returns the string for the given date number/string in UTC format.
     */
    getDate: function(date) {
      if(date) {
        return moment.utc(new Date(date)).format('MMM D, YYYY');
      }
    },

    /**
     * Returns the formatted telephone number.
     */
    getFormattedPhone: function(phone) {
      return getFormattedPhone(phone);
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
     * Returns the extraction data from the given compound extraction ID formatted as text-key1:value1-key2:value2...
     */
    getExtractionDataFromCompoundId: function(id) {
      return getExtractionDataFromCompoundId(id);
    },

    /**
     * Returns the location data from the given ID formatted as city:state:country:longitude:latitude.
     */
    getLocationDataFromId: function(id) {
      return getLocationDataFromId(id);
    },

    /**
     * Returns the pretty name for the given type.
     */
    getName: function(type, plural) {
      return getName(type, plural);
    },

    /**
     * Returns the style class for the given type.
     */
    getStyleClass: function(type) {
      return getStyleClass(type);
    },

    /**
     * Returns the extraction UI type for the given database type.
     */
    getUiTypeFromDatabaseType: function(type) {
      return getUiTypeFromDatabaseType(type);
    },

    /**
     * Returns whether the given location has the correct properties.
     */
    isGoodLocation: function(location) {
      return isGoodLocation(location);
    }
  };
});
