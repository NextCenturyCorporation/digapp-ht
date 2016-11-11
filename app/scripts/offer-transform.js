/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported offerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var offerTransform = (function(_, commonTransforms) {

  /** build address object:
  "address": {
      "locality": "Los Angeles",
      "region": "California",
      "formattedAddress": 'Los Angeles, California'
  }
  */
  function getAddress(record) {
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
      address.formattedAddress = 'No Address';
    }

    return address;
  }

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
    newData.address = getAddress(record);
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

  function getOfferSummary(record) {
    return commonTransforms.getOfferObject(record, '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
  }

  function offsetDates(dates) {
    var sorted = _.sortBy(dates);
    for(var i = 1; i < sorted.length; i++) {
      if(sorted[i] === sorted[i - 1]) {
        sorted[i] = new Date(sorted[i].getTime() + 300);
      }
    }

    return sorted;
  }

  function createLocationTimelineNotes(bucket) {
    var notes = [];

    if(bucket.publishers) {
      notes.push({
        name: 'Websites',
        data: _.map(bucket.publishers.buckets, function(publisher) {
          return {
            icon: commonTransforms.getIronIcon('webpage'),
            styleClass: commonTransforms.getStyleClass('webpage'),
            text: publisher.key,
            type: 'webpage'
          };
        })
      });
    }

    if(bucket.phones) {
      var phones = commonTransforms.getMentions(_.map(bucket.phones.buckets, function(phone) {
        return phone.key;
      }), 'phone');
      if(phones.length) {
        notes.push({
          name: 'Telephone Numbers',
          data: phones
        });
      }
    }

    if(bucket.emails) {
      var emails = commonTransforms.getMentions(_.map(bucket.emails.buckets, function(email) {
        return email.key;
      }), 'email');
      if(emails.length) {
        notes.push({
          name: 'Email Addresses',
          data: emails
        });
      }
    }

    return notes;
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and notes for each location.
   * [{
   *     date: 1455657767,
   *     subtitle: "Mountain View, CA",
   *     locations: [{
   *         name: "Mountain View, CA, USA",
   *         type: "location",
   *         count: 12,
   *         notes: [{
   *             name: "Email Address",
   *             data: [{
   *                 id: "http://email/abc@xyz.com",
   *                 link: "/email.html?value=http://email/abc@xyz.com&field=_id",
   *                 text: "abc@xyz.com",
   *                 type: "email"
   *             }]
   *         }, {
   *             name: "Telephone Number",
   *             data: [{
   *                 id: "http://phone/1234567890",
   *                 link: "/phone.html?value=http://phone/1234567890&field=_id",
   *                 text: "1234567890",
   *                 type: "phone"
   *             }, {
   *                 id: "http://phone/0987654321",
   *                 link: "/phone.html?value=http://phone/0987654321&field=_id",
   *                 text: "0987654321",
   *                 type: "phone"
   *             }]
   *         }, {
   *             name: "Website",
   *             data: [{
   *                 text: "google.com",
   *                 type: "webpage"
   *             }]
   *         }]
   *     }]
   * }]
   */
  function createLocationTimeline(buckets) {
    var timeline = _.reduce(buckets, function(timeline, bucket) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      if(bucket.doc_count) {
        var dateBucket = {
          date: commonTransforms.getDate(bucket.key),
          icon: commonTransforms.getIronIcon('date'),
          styleClass: commonTransforms.getStyleClass('date')
        };

        var sum = 0;
        var subtitle = [];

        dateBucket.locations = _.map(bucket.locations.buckets, function(locationBucket) {
          sum += locationBucket.doc_count;
          subtitle.push(locationBucket.key.split(':').slice(0, 2).join(', ') + ' (' + locationBucket.doc_count + ')');
          return {
            name: locationBucket.key.split(':').slice(0, 3).join(', '),
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            type: 'location',
            count: locationBucket.doc_count,
            notes: createLocationTimelineNotes(locationBucket)
          };
        });

        if(sum < bucket.doc_count) {
          subtitle.push('Unknown Locations (' + (bucket.doc_count - sum) + ')');
          dateBucket.locations.push({
            name: 'Unknown Location(s)',
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            type: 'location',
            count: bucket.doc_count - sum,
            notes: []
          });
        }

        dateBucket.subtitle = subtitle.length > 3 ? (subtitle.slice(0, 3).join('; ') + '; and ' + (subtitle.length - 3) + ' more') : subtitle.join('; ');
        timeline.push(dateBucket);
      }
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      return timeline;
    }, []);

    // Sort newest first.
    timeline.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return timeline;
  }

  return {
    // expected data is from an elasticsearch
    offer: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData = parseOffer(data.hits.hits[0]._source);
      }

      return newData;
    },

    offers: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getOfferSummary(record));
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },

    removeDescriptorFromOffers: function(descriptorId, offers) {
      return offers.map(function(offer) {
        offer.descriptors = offer.descriptors.filter(function(descriptor) {
          return descriptor.id !== descriptorId;
        });
        return offer;
      });
    },

    removeNoteFromLocationTimeline: function(noteItemId, timeline) {
      return timeline.map(function(date) {
        date.locations = date.locations.map(function(location) {
          location.notes = location.notes.map(function(note) {
            var previousLength = note.data.length;
            note.data = note.data.filter(function(item) {
              return item.id !== noteItemId;
            });
            if(note.data.length < previousLength) {
              note.name = 'Other ' + note.name;
            }
            return note;
          });
          // Remove any notes that no longer have any data.
          location.notes = location.notes.filter(function(note) {
            return note.data.length;
          });
          return location;
        });
        return date;
      });
    },

    locationTimeline: function(data) {
      return {
        dates: (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets) : undefined
      };
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
            if(dateBucket.key) {
              cityAggs[city].push(new Date(dateBucket.key));
              timestamps.push(dateBucket.key);
            }
          });
        });

        /* Transform data */
        for(var city in cityAggs) {
          var dates = offsetDates(cityAggs[city]);

          var nameList = city.split(':');
          transformedData.push({
            name: nameList[0] + ', ' + nameList[1],
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
          return image.text;
        }).join('; ');
        data.push([result.url, linkPrefix + result.link, result.text, result.date, result.publisher, result.locations, result.phones, result.emails, images, result.description.replace(/\n/g, ' ')]);
      });
      return data;
    }
  };
})(_, commonTransforms);
