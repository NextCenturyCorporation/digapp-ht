/**
 * transform elastic search offer query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported offerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as well as commonTransforms */
var offerTransform = (function(_, commonTransforms) {

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
        "text": "Emily, 20, white"
    }
    */
    var person = {};
    person.id = _.get(record, 'uri') || null;
    person.type = 'provider';
    person.icon = commonTransforms.getIronIcon('provider');
    person.link = commonTransforms.getLink(person.id, 'provider') || null;
    person.styleClass = commonTransforms.getStyleClass('provider');

    person.names = _.get(record, 'name') || [];
    person.names = (_.isArray(person.names) ? person.names : [person.names]);
    person.ages = _.get(record, 'age') || [];
    person.ages = (_.isArray(person.ages) ? person.ages : [person.ages]);
    person.ethnicities = _.get(record, 'ethnicity') || [];
    person.ethnicities = (_.isArray(person.ethnicities) ? person.ethnicities : [person.ethnicities]);
    person.hairColors = _.get(record, 'hairColor') || [];
    person.hairColors = (_.isArray(person.hairColors) ? person.hairColors : [person.hairColors]);
    person.eyeColors = _.get(record, 'eyeColor') || [];
    person.eyeColors = (_.isArray(person.eyeColors) ? person.eyeColors : [person.eyeColors]);
    person.heights = _.get(record, 'height') || [];
    person.heights = (_.isArray(person.heights) ? person.heights : [person.heights]);
    person.weights = _.get(record, 'weight') || [];
    person.weights = (_.isArray(person.weights) ? person.weights : [person.weights]);

    var text = (person.names.length) ? [person.names[0]] : [];
    if(person.ages && person.ages.length) {
      text.push(person.ages[0]);
    }
    if(person.ethnicities && person.ethnicities.length) {
      text.push(person.ethnicities[0]);
    }
    person.text = text.join(', ');
    return person;
  }

  /**
   * Returns the list of DIG image objects using the given images from the data.
   */
  function getImages(images) {
    return (_.isArray(images) ? images : [images]).map(function(image) {
      return {
        id: image.uri,
        icon: commonTransforms.getIronIcon('image'),
        link: commonTransforms.getLink(image.uri, 'image'),
        source: _.isArray(image.url) ? image.url[0] : image.url,
        styleClass: commonTransforms.getStyleClass('image')
      };
    });
  }

  /**
   * Returns the list of DIG location objects using the given locations (addresses) from the data.
   */
  function getLocations(locations) {
    return (_.isArray(locations) ? locations : [locations]).map(function(location) {
      var locality = _.get(location, 'addressLocality');
      var region = _.get(location, 'addressRegion');
      var country = _.get(location, 'addressCountry');
      var latitude = _.get(location, 'geo.latitude');
      var longitude = _.get(location, 'geo.longitude');

      return {
        latitude: latitude,
        longitude: longitude,
        icon: commonTransforms.getIronIcon('location'),
        styleClass: commonTransforms.getStyleClass('location'),
        text: locality ? (locality + (region ? (', ' + region) : '') + (country ? (', ' + country) : '')) : '',
        type: 'location'
      };
    }).filter(function(location) {
      return location.latitude && location.longitude && location.text;
    });
  }

  /**
   * Returns the list of DIG mention objects of the given type using the given mentions from the data.
   */
  function getMentions(mentions, type) {
    return (_.isArray(mentions) ? mentions : [mentions]).map(function(uri) {
      var text = uri.substring(uri.lastIndexOf('/') + 1);
      if(type === 'phone' && text.indexOf('-') >= 0) {
        // Remove country code.
        text = text.substring(text.indexOf('-') + 1);
      }
      if(type === 'email') {
        text = decodeURIComponent(text);
      }
      return {
        id: uri,
        type: type,
        text: text,
        icon: commonTransforms.getIronIcon(type),
        link: commonTransforms.getLink(uri, type),
        styleClass: commonTransforms.getStyleClass(type)
      };
    });
  }

  /**
   * Returns the list of DIG price objects using the given prices from the data.
   */
  function getPrices(prices) {
    return (_.isArray(prices) ? prices : [prices]).map(function(price) {
      return {
        type: 'money',
        text: price.name,
        icon: commonTransforms.getIronIcon('money'),
        styleClass: commonTransforms.getStyleClass('money')
      };
    }).filter(function(price) {
      return price.text !== '-per-min';
    });
  }

  function getOfferObject(record, mainPath, idPath, datePath, entityPath) {
    var id = _.get(record, idPath);
    if(!id) {
      return {};
    }

    var url = _.get(record, mainPath + '.url');
    var cacheId = id.length && id.lastIndexOf('/') >= 0 ? id.substring(id.lastIndexOf('/') + 1) : '';

    var offerObject = {
      id: id,
      type: 'offer',
      date: commonTransforms.getDate(_.get(record, datePath)) || 'No Date',
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      url: url,
      name: _.get(record, mainPath + '.name', 'No Title'),
      publisher: _.get(record, mainPath + '.publisher.name', 'No Publisher'),
      description: _.get(record, mainPath + '.description', 'No Description'),
      phones: getMentions(_.get(record, mainPath + '.mentionsPhone', []), 'phone'),
      emails: getMentions(_.get(record, mainPath + '.mentionsEmail', []), 'email'),
      images: getImages(_.get(record, mainPath + '.hasImagePart', [])),
      person: getPerson(_.get(record, entityPath + '.itemOffered')),
      prices: getPrices(_.get(record, entityPath + '.priceSpecification', [])),
      locations: getLocations(_.get(record, entityPath + '.availableAtOrFrom.address', [])),
      webpages: url ? [{
        id: _.get(record, mainPath + '.uri'),
        type: 'webpage',
        text: url,
        icon: commonTransforms.getIronIcon('webpage'),
        link: url,
        styleClass: commonTransforms.getStyleClass('webpage')
      }] : [],
      caches: cacheId ? [{
        id: cacheId,
        type: 'cache',
        text: 'Cached Ad',
        icon: commonTransforms.getIronIcon('cache'),
        link: commonTransforms.getLink(cacheId, 'cache'),
        styleClass: commonTransforms.getStyleClass('cache')
      }] : [],
      descriptors: [],
      details: []
    };

    offerObject.name = _.isArray(offerObject.name) ? offerObject.name.join(', ') : offerObject.name;
    offerObject.location = offerObject.locations.length ? offerObject.locations[0].text : 'No Location';

    offerObject.descriptors.push({
      icon: commonTransforms.getIronIcon('date'),
      styleClass: commonTransforms.getStyleClass('date'),
      type: 'date',
      text: offerObject.date
    });
    offerObject.descriptors.push({
      icon: commonTransforms.getIronIcon('webpage'),
      styleClass: commonTransforms.getStyleClass('webpage'),
      type: 'webpage',
      text: offerObject.publisher
    });
    offerObject.descriptors.push({
      icon: commonTransforms.getIronIcon('location'),
      styleClass: commonTransforms.getStyleClass('location'),
      text: offerObject.location,
      type: 'location'
    });
    offerObject.descriptors = offerObject.descriptors.concat(offerObject.phones);
    offerObject.descriptors = offerObject.descriptors.concat(offerObject.emails);

    offerObject.details.push({
      name: 'Url',
      link: url || null,
      text: url || 'Unavailable'
    });
    offerObject.details.push({
      name: 'Description',
      text: offerObject.description
    });
    offerObject.details.push({
      name: 'Cached Ad',
      link: cacheId ? commonTransforms.getLink(cacheId, 'cache') : null,
      text: cacheId ? 'Open' : 'Unavailable'
    });

    return offerObject;
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
      var phones = getMentions(_.map(bucket.phones.buckets, function(phone) {
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
      var emails = getMentions(_.map(bucket.emails.buckets, function(email) {
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

  /**
  * Changes the key/value names of buckets given from an aggregation
  * to names preferred by the user.
  */
  function transformBuckets(buckets, keyName, alternateKey) {
    return _.map(buckets, function(bucket) {
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
  }

  return {
    // expected data is from an elasticsearch
    offer: function(data) {
      if(data && data.hits.hits.length > 0) {
        return getOfferObject(data.hits.hits[0], '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
      }
      return {};
    },

    offers: function(data) {
      var offers = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var offerObject = getOfferObject(record, '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
          offers.data.push(offerObject);
        });
        offers.count = data.hits.total;
      }
      return offers;
    },

    offerFromPaths: function(record, mainPath, idPath, datePath, entityPath) {
      return getOfferObject(record, mainPath, idPath, datePath, entityPath);
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

    offerLocations: function(data) {
      if(!data || !data.aggregations) {
        return {
          location: []
        };
      }

      var locations = [];
      _.each(data.aggregations.location.location.buckets, function(locationBucket) {
        var locationData = locationBucket.key.split(':');
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var location = {
          key: locationBucket.key,
          count: locationBucket.doc_count,
          longitude: locationData[3],
          latitude: locationData[4],
          name: locationData[0] + ', ' + locationData[1],
          longName: locationData[0] + ', ' + locationData[1] + ', ' + locationData[2] + ' (' + locationBucket.doc_count + ')'
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        locations.push(location);
      });

      return {
        location: locations
      };
    },

    createExportData: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [['ad url', 'dig url', 'title', 'date', 'publisher', 'locations', 'telephone numbers', 'email addresses', 'images', 'description']];
      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.text;
        }).join('; ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join('; ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join('; ');
        var images = result.images.map(function(image) {
          return image.source;
        }).join('; ');
        data.push([result.url, linkPrefix + result.link, result.name, result.date, result.publisher, locations, phones, emails, images, result.description.replace(/\n/g, ' ')]);
      });
      return data;
    }
  };
})(_, commonTransforms);
