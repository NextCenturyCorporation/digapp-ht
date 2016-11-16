/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _, commonTransforms, relatedEntityTransform */
/* exported offerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var offerTransform = (function(_, commonTransforms, relatedEntityTransform) {

  function getGeolocation(record) {
    /** build geolocation array object:
    "geolocation": [{
        "latitude": 33.916403,
        "longitude": -118.352575
    }]

    should only be one location, but needs to be in array format
    to be processed by leaflet-wrapper

    if no latitude && longitude, return empty array
    */
    var geolocation = [];
    var latitude = _.get(record, 'availableAtOrFrom.address[0].geo.latitude');
    var longitude = _.get(record, 'availableAtOrFrom.address[0].geo.longitude');

    if(latitude && longitude) {
      var location = {};
      location.latitude = latitude;
      location.longitude = longitude;
      var locality = _.get(record, 'availableAtOrFrom.address[0].addressLocality');
      var region = _.get(record, 'availableAtOrFrom.address[0].addressRegion');
      var country = _.get(record, 'availableAtOrFrom.address[0].addressCountry');
      location.longName = locality + ', ' + region + ', ' + country;
      geolocation.push(location);
    }

    return geolocation;
  }

  function getPerson(record) {
    /** build person object:
    "person": {
        "id": "id",
        "type": "provider",
        "link": "/provider.html?value=<id>&field=_id",
        "names": ["Emily"],
        "ages": [20],
        "ethnicities": ["white"],
        "hairColors": ["blonde"],
        "eyeColors": ["blue"],
        "heights": [64],
        "weights": [115],
        "text": "Emily, 20, white",
        "show": true
    }
    */
    var person = {};
    person.id = _.get(record, 'itemOffered.uri');
    person.type = 'provider';
    person.icon = commonTransforms.getIronIcon('provider');
    person.link = commonTransforms.getLink(person.id, 'provider');
    person.styleClass = commonTransforms.getStyleClass('provider');

    person.names = _.get(record, 'itemOffered.name') || [];
    person.names = (_.isArray(person.names) ? person.names : [person.names]);
    person.ages = _.get(record, 'itemOffered.age') || [];
    person.ages = (_.isArray(person.ages) ? person.ages : [person.ages]);
    person.ethnicities = _.get(record, 'itemOffered.ethnicity') || [];
    person.ethnicities = (_.isArray(person.ethnicities) ? person.ethnicities : [person.ethnicities]);
    person.hairColors = _.get(record, 'itemOffered.hairColor') || [];
    person.hairColors = (_.isArray(person.hairColors) ? person.hairColors : [person.hairColors]);
    person.eyeColors = _.get(record, 'itemOffered.eyeColor') || [];
    person.eyeColors = (_.isArray(person.eyeColors) ? person.eyeColors : [person.eyeColors]);
    person.heights = _.get(record, 'itemOffered.height') || [];
    person.heights = (_.isArray(person.heights) ? person.heights : [person.heights]);
    person.weights = _.get(record, 'itemOffered.weight') || [];
    person.weights = (_.isArray(person.weights) ? person.weights : [person.weights]);

    var text = (person.names.length) ? [person.names[0]] : [];
    if(person.ages && person.ages.length) {
      text.push(person.ages[0]);
    }
    if(person.ethnicities && person.ethnicities.length) {
      text.push(person.ethnicities[0]);
    }
    person.text = text.join(', ');
    person.show = (text.length > 0) ? true : false;
    return person;
  }

  function getPrices(prices) {
    if(prices) {
      return (_.isArray(prices) ? prices : [prices]).map(function(priceObject) {
        return priceObject.name;
      }).filter(function(price) {
        return price !== '-per-min';
      });
    }
    return [];
  }

  function parseOffer(record) {
    var newData = {};

    newData.id = _.get(record, 'uri');
    newData.icon = commonTransforms.getIronIcon('offer');
    newData.styleClass = commonTransforms.getStyleClass('offer');
    newData.date = _.get(record, 'validFrom');
    newData.address = commonTransforms.getAddress(record);
    newData.geolocation = getGeolocation(record);
    newData.person = getPerson(record);
    newData.prices = commonTransforms.getClickableObjects(getPrices(_.get(record, 'priceSpecification')).map(function(price) {
      return {
        name: price
      };
    }), 'money');
    newData.name = _.get(record, 'title', 'Title N/A');
    newData.publisher = _.get(record, 'mainEntityOfPage.publisher.name');
    newData.body = _.get(record, 'mainEntityOfPage.description');
    newData.emails = commonTransforms.getClickableObjects(_.get(record, 'seller.email'), 'email');
    newData.phones = commonTransforms.getClickableObjects(_.get(record, 'seller.telephone'), 'phone');
    newData.sellerId = _.get(record, 'seller.uri');
    newData.serviceId = _.get(record, 'itemOffered.uri');
    newData.webpageId = _.get(record, 'mainEntityOfPage.uri');
    newData.webpageUrl = _.get(record, 'mainEntityOfPage.url');
    newData.webpages = commonTransforms.getClickableObjects({
      uri: _.get(record, 'mainEntityOfPage.uri'),
      name: _.get(record, 'mainEntityOfPage.url')
    }, 'webpage');
    newData.cache = commonTransforms.getClickableObjects({
      uri: newData.id ? newData.id.substring(newData.id.lastIndexOf('/') + 1) : '',
      name: 'Cached Ad'
    }, 'cache');

    return newData;
  }

  var offsetDates = function(dates) {
    var sorted = _.sortBy(dates, [function(o) { return o.date; }]);
    for(var i = 1; i < sorted.length; i++) {
      if(sorted[i] === sorted[i - 1]) {
        sorted[i] = new Date(sorted[i].getTime() + 300);
      }
    }

    return sorted;
  };

  return {
    // expected data is from an elasticsearch
    offer: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData = parseOffer(data.hits.hits[0]._source);
      }

      return newData;
    },

    revisions: function(data) {
      return relatedEntityTransform.offer(data);
    },

    removeDescriptorFromOffers: function(descriptorId, offers) {
      return offers.map(function(offer) {
        offer.descriptors = offer.descriptors.filter(function(descriptor) {
          return descriptor.id !== descriptorId;
        });
        return offer;
      });
    },

    dropsTimeline: function(data) {

      var timestamps = [];
      var transformedData = [];

      if(data && data.aggregations) {

        /* Aggregate cities */
        var cityAggs = {};

        data.aggregations.locations.locations.buckets.forEach(function(locationBucket) {
          var city = locationBucket.key;

          /* Assign city Aggregations */
          if(!(city in cityAggs)) {
            cityAggs[city] = [];
          }

          locationBucket.dates.buckets.forEach(function(dateBucket) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            if(dateBucket.key && dateBucket.doc_count > 0) {
              cityAggs[city].push({date: new Date(dateBucket.key), count: dateBucket.doc_count});
              timestamps.push(dateBucket.key);
            }
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          });
        });

        /* Transform data */
        for(var city in cityAggs) {
          var dates = offsetDates(cityAggs[city]);

          var nameList = city.split(':');
          var combineCityStateNames = nameList[0] + ', ' + nameList[1];
          transformedData.push({
            name: (combineCityStateNames.length <= 24) ? combineCityStateNames : nameList[0],
            dates: dates
          });
        }
      }

      return {
        data: transformedData,
        timestamps: timestamps
      };
    },

    createMentions: function(ignoreId, data) {
      var mentions = [];
      if(data && data.aggregations) {
        data.aggregations.phones.phones.buckets.forEach(function(bucket) {
          if(ignoreId !== bucket.key) {
            var text = bucket.key.substring(bucket.key.lastIndexOf('/') + 1);
            if(text.indexOf('-') >= 0) {
              // Remove country code.
              text = text.substring(text.indexOf('-') + 1);
            }
            mentions.push({
              icon: commonTransforms.getIronIcon('phone'),
              link: commonTransforms.getLink(bucket.key, 'phone'),
              styleClass: commonTransforms.getStyleClass('phone'),
              text: text
            });
          }
        });
        data.aggregations.emails.emails.buckets.forEach(function(bucket) {
          if(ignoreId !== bucket.key) {
            mentions.push({
              icon: commonTransforms.getIronIcon('email'),
              link: commonTransforms.getLink(bucket.key, 'email'),
              styleClass: commonTransforms.getStyleClass('email'),
              text: decodeURIComponent(bucket.key.substring(bucket.key.lastIndexOf('/') + 1))
            });
          }
        });
      }
      return mentions;
    },

    createExportData: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [['ad url', 'dig url', 'title', 'date', 'publisher', 'locations', 'telephone numbers', 'email addresses', 'images', 'description']];
      results.forEach(function(result) {
        var images = result.images.map(function(image) {
          return image.source;
        }).join('; ');
        data.push([result.url, linkPrefix + result.link, result.text, result.date, result.publisher, result.locations, result.phones, result.emails, images, result.description.replace(/\n/g, ' ')]);
      });
      return data;
    }
  };
})(_, commonTransforms, relatedEntityTransform);
