/**
 * Common transform functions used.
 */

/* globals _, dateFormat */
/* exported commonTransforms */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var commonTransforms = (function(_, dateFormat) {

  /**
   * Returns the iron icon for the given type.
   */
  function getIronIcon(type) {
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
      case 'seller': return 'group-work';
      case 'webpage': return 'av:web';
    }
    return 'icons:polymer';
  }

  /**
   * Returns the link for the given ID and type.
   */
  function getLink(id, type) {
    if(!id || !type || !(type === 'cache' || type === 'email' || type === 'image' || type === 'offer' || type === 'phone' || type === 'provider' || type === 'seller')) {
      return undefined;
    }
    return '/' + type + '.html?value=' + id + '&field=_id';
  }

  /**
   * Returns the style class for the given type.
   */
  function getStyleClass(type) {
    if(!type) {
      return '';
    }
    return 'entity-' + type + '-font';
  }

  function getGeoFromKeys(record) {
    var geos = [];
    _.each(record, function(key) {
      var geoData = key.key.split(':');
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var geo = {
        key: key.key,
        count: key.doc_count,
        longitude: geoData[3],
        latitude: geoData[4],
        name: geoData[0] + ', ' + geoData[1],
        longName: geoData[0] + ', ' + geoData[1] + ', ' + geoData[2] + ' (' + key.doc_count + ')'
      };
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      geos.push(geo);
    });
    return geos;
  }

  /**
  * Changes the key/value names of buckets given from an aggregation
  * to names preferred by the user.
  */
  function transformBuckets(buckets, keyName, alternateKey) {
    buckets = _.map(buckets, function(bucket) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var obj = {
        count: bucket.doc_count
      };
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      if(alternateKey) {
        obj[keyName] = bucket[alternateKey];
      } else {
        obj[keyName] = bucket.key;
      }
      return obj;
    });
    return buckets;
  }

  return {
    /**
    * Changes the key/value names of buckets given from an aggregation
    * to names preferred by the user.
    */
    transformBuckets: function(buckets, keyName, alternateKey) {
      return transformBuckets(buckets, keyName, alternateKey);
    },

    /**
        Get people aggregation info:

        "name": [
            {"key": "Emily", "count": 14},
            {"key": "Erin", "count": 12},
            {"key": "Jane", "count": 3}
        ]
    */
    peopleFeaturesName: function(data) {
      return {
        name: (data && data.aggregations) ? transformBuckets(data.aggregations.name.name.buckets, 'key') : []
      };
    },

    peopleFeaturesAge: function(data) {
      return {
        age: (data && data.aggregations) ? transformBuckets(data.aggregations.age.age.buckets, 'key') : []
      };
    },

    peopleFeaturesEthnicity: function(data) {
      return {
        ethnicity: (data && data.aggregations) ? transformBuckets(data.aggregations.ethnicity.ethnicity.buckets, 'key') : []
      };
    },

    peopleFeaturesEyeColor: function(data) {
      return {
        eyeColor: (data && data.aggregations) ? transformBuckets(data.aggregations.eyeColor.eyeColor.buckets, 'key') : []
      };
    },

    peopleFeaturesHairColor: function(data) {
      return {
        hairColor: (data && data.aggregations) ? transformBuckets(data.aggregations.hairColor.hairColor.buckets, 'key') : []
      };
    },

    peopleFeaturesHeight: function(data) {
      return {
        height: (data && data.aggregations) ? transformBuckets(data.aggregations.height.height.buckets, 'key') : []
      };
    },

    peopleFeaturesWeight: function(data) {
      return {
        weight: (data && data.aggregations) ? transformBuckets(data.aggregations.weight.weight.buckets, 'key') : []
      };
    },

    /**
        "locations": [
            {
                "city": "hawthorn",
                "state": "california",
                "latitude": 33.916403,
                "longitude": -118.352575,
                "date": "2012-04-23T18:25:43.511Z"
            }
        ]
    */
    getLocations: function(hits) {
      var locations = [];
      _.each(hits, function(hit) {
        var location = hit._source.availableAtOrFrom;
        if(location) {

          _.each(location.address, function(address) {
            locations.push({
              city: address.addressLocality,
              state: address.addressRegion,
              latitude: address.geo ? _.get(address, 'geo.latitude') : undefined,
              longitude: address.geo ? _.get(address, 'geo.longitude') : undefined,
              date: hit._source.validFrom
            });
          });
        }
      });

      return locations;
    },

    /** build address object:
    "address": {
        "locality": "Los Angeles",
        "region": "California",
        "formattedAddress": 'Los Angeles, California'
    }
    */
    getAddress: function(record) {
      var address = {};
      address.locality = _.get(record, 'availableAtOrFrom.address[0].addressLocality');
      address.region = _.get(record, 'availableAtOrFrom.address[0].addressRegion');

      var formattedAddress = [];
      if(address.locality) {
        formattedAddress.push(address.locality);
      }

      if(address.region) {
        if(formattedAddress.length > 0) {
          formattedAddress.push(', ');
        }
        formattedAddress.push(address.region);
      }

      address.formattedAddress = formattedAddress.join('');

      if(_.isEmpty(address.formattedAddress)) {
        address.formattedAddress = 'Address N/A';
      }

      return address;
    },

    /** build an array of strings:
        example: ["1112223333", "0123456789"]
    */
    getArrayOfStrings: function(record, pathToArray, pathToString) {
      var arrayToReturn = [];
      var initialArray = _.get(record, pathToArray, []);

      (_.isArray(initialArray) ? initialArray : [initialArray]).forEach(function(element) {
        arrayToReturn.push(_.get(element, pathToString));
      });

      return arrayToReturn;
    },

    getClickableObjects: function(records, type) {
      var result = [];
      if(records) {
        (_.isArray(records) ? records : [records]).forEach(function(record) {
          if(record.name) {
            var obj = {
              id: record.uri,
              type: type,
              text: type === 'email' ? decodeURIComponent(record.name) : record.name,
              icon: getIronIcon(type),
              link: type === 'webpage' ? record.name : getLink(record.uri, type),
              styleClass: getStyleClass(type)
            };
            result.push(obj);
          }
        });
      }

      return result;
    },

    /**
     * Returns the string for the given date number/string in UTC format.
     */
    getDate: function(date) {
      if(date) {
        return dateFormat(new Date(date), 'mmm d, yyyy', true);
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
    },

    offerLocationData: function(data) {
      return {
        location: (data && data.aggregations) ? getGeoFromKeys(data.aggregations.location.location.buckets) : []
      };
    },

    getMentions: function(mentions, type) {
      var output = [];
      (_.isArray(mentions) ? mentions : [mentions]).forEach(function(uri) {
        var text = uri.substring(uri.lastIndexOf('/') + 1);
        if(type === 'phone' && text.indexOf('-') >= 0) {
          // Remove country code.
          text = text.substring(text.indexOf('-') + 1);
        }
        if(type === 'email') {
          text = decodeURIComponent(text);
        }
        output.push({
          id: uri,
          type: type,
          text: text,
          icon: getIronIcon(type),
          link: getLink(uri, type),
          styleClass: getStyleClass(type)
        });
      });
      return output;
    }
  };
})(_, dateFormat);
