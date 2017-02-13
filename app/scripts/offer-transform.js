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
 * transform elastic search offer query to display format.  See data-model.json
 */

/* exported offerTransform */
/* jshint camelcase:false */

var offerTransform = (function(_, commonTransforms) {

  /**
   * Returns the list of DIG image objects using the given images from the data.
   */
  /*
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
  */

  function getDataFromRecord(record, path) {
    var strict = _.get(record, path + '.strict', []);
    var strictKeys = strict.map(function(item) {
      return item.key;
    });

    // Relaxed is a superset of strict.  Remove all items from relaxed that exist in strict for this use case.
    var relaxed = _.get(record, path + '.relaxed', []).filter(function(item) {
      return strictKeys.indexOf(item.key) < 0;
    });

    return {
      relaxed: relaxed,
      strict: strict
    };
  }

  function getSingleItemFromRecord(record, path) {
    var items = getDataFromRecord(record, path);
    return items.strict.length ? items.strict[0].name : (items.relaxed.length ? items.relaxed[0].name : undefined);
  }

  function getDate(record, path) {
    var date = getSingleItemFromRecord(record, path);
    return commonTransforms.getDate(date);
  }

  function getEmailsFromList(list, confidence) {
    return list.map(function(email) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = email.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: email.key,
        icon: commonTransforms.getIronIcon('email'),
        link: commonTransforms.getLink(encodeURIComponent(email.key), 'email'),
        styleClass: commonTransforms.getStyleClass('email'),
        text: decodeURIComponent(email.name || email.key),
        type: 'email'
      };
    });
  }

  function getEmailsFromRecord(record, path) {
    var emails = getDataFromRecord(record, path);
    return getEmailsFromList(emails.strict, 'strict').concat(getEmailsFromList(emails.relaxed, 'relaxed'));
  }

  function getPhonesFromList(list, confidence) {
    return list.map(function(phone) {
      var name = phone.name || phone.key;
      // Remove United States country code.
      name = (name.indexOf('+1-') === 0 ? name.substring(name.indexOf('+1-') + 3) : name);
      name = (name.indexOf('+x-') === 0 ? name.substring(name.indexOf('+x-') + 3) : name);
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = phone.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: phone.key,
        icon: commonTransforms.getIronIcon('phone'),
        link: commonTransforms.getLink(phone.key, 'phone'),
        styleClass: commonTransforms.getStyleClass('phone'),
        text: name,
        type: 'phone'
      };
    });
  }

  function getPhonesFromRecord(record, path) {
    var phones = getDataFromRecord(record, path);
    return getPhonesFromList(phones.strict, 'strict').concat(getPhonesFromList(phones.relaxed, 'relaxed'));
  }

  function getPricesFromRecord(record, path) {
    var getPricesFromList = function(list, confidence) {
      return list.map(function(price) {
        return {
          confidence: confidence,
          icon: commonTransforms.getIronIcon('money'),
          styleClass: commonTransforms.getStyleClass('money'),
          text: price.key,
          type: 'money'
        };
      }).filter(function(price) {
        return price.text !== '-per-min';
      });
    };

    var prices = getDataFromRecord(record, path);
    return getPricesFromList(prices.strict, 'strict').concat(getPricesFromList(prices.relaxed, 'relaxed'));
  }

  function getProviderAttributesFromList(list, confidence) {
    return list.map(function(attribute) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = attribute.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: attribute.key,
        icon: commonTransforms.getIronIcon('provider'),
        styleClass: commonTransforms.getStyleClass('provider'),
        text: attribute.name || attribute.key,
        type: 'provider'
      };
    });
  }

  function getProviderAttributesFromRecord(record, path) {
    var attributes = getDataFromRecord(record, path);
    return getProviderAttributesFromList(attributes.strict, 'strict').concat(getProviderAttributesFromList(attributes.relaxed, 'relaxed'));
  }

  function getPublishersFromList(list) {
    return list.map(function(publisher) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = publisher.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        count: count,
        id: publisher.key,
        icon: commonTransforms.getIronIcon('webpage'),
        styleClass: commonTransforms.getStyleClass('webpage'),
        text: publisher.key,
        type: 'webpage'
      };
    });
  }

  function getUniqueLocation(location, confidence) {
    var keySplit = location.key.split(':');

    if(keySplit.length < 5) {
      return {};
    }

    var city = keySplit[0];
    var state = keySplit[1];
    var country = keySplit[2];
    var latitude = keySplit[4];
    var longitude = keySplit[3];
    var text = state ? ((city ? (city + ', ') : '') + state) : 'Unknown Location';

    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var count = location.doc_count;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    return {
      confidence: confidence,
      count: count,
      id: location.key,
      latitude: latitude,
      longitude: longitude,
      icon: commonTransforms.getIronIcon('location'),
      link: commonTransforms.getLink(location.key, 'location'),
      styleClass: commonTransforms.getStyleClass('location'),
      text: text,
      textAndCount: text + ' (' + count + ')',
      textAndCountry: text + (country ? (', ' + country) : ''),
      type: 'location'
    };
  }

  function getUniqueLocationsFromList(list, confidence) {
    return list.map(function(location) {
      return getUniqueLocation(location, confidence);
    }).filter(function(location) {
      return location.latitude && location.longitude && location.text;
    });
  }

  function getUniqueLocationsFromRecord(record, path) {
    var locations = getDataFromRecord(record, path);
    return getUniqueLocationsFromList(locations.strict, 'strict').concat(getUniqueLocationsFromList(locations.relaxed, 'relaxed'));
  }

  function getOfferObject(record) {
    var id = _.get(record, '_source.doc_id');
    var url = _.get(record, '_source.url');
    var domain = _.get(record, '_source.tld');

    if(!id || !url || !domain) {
      return {};
    }

    var offer = {
      id: id,
      url: url,
      domain: domain,
      type: 'offer',
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      title: getSingleItemFromRecord(record, '_source.fields.title') || 'No Title',
      description: getSingleItemFromRecord(record, '_source.fields.description') || 'No Description',
      phones: getPhonesFromRecord(record, '_source.fields.phone'),
      emails: getEmailsFromRecord(record, '_source.fields.email'),
      prices: getPricesFromRecord(record, '_source.fields.price'),
      locations: getUniqueLocationsFromRecord(record, '_source.fields.city'),
      names: getProviderAttributesFromRecord(record, '_source.fields.name'),
      ages: getProviderAttributesFromRecord(record, '_source.fields.age'),
      ethnicities: getProviderAttributesFromRecord(record, '_source.fields.ethnicity'),
      hairColors: getProviderAttributesFromRecord(record, '_source.fields.hair-color'),
      eyeColors: getProviderAttributesFromRecord(record, '_source.fields.eye-color'),
      heights: getProviderAttributesFromRecord(record, '_source.fields.height'),
      weights: getProviderAttributesFromRecord(record, '_source.fields.weight'),
      date: {
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        text: getDate(record, '_source.fields.posting-date'),
        type: 'date'
      },
      publishers: getPublishersFromList([{
        key: domain
      }]),
      webpages: [{
        icon: commonTransforms.getIronIcon('webpage'),
        link: url,
        styleClass: commonTransforms.getStyleClass('webpage'),
        text: url,
        type: 'webpage'
      }],
      caches: [{
        icon: commonTransforms.getIronIcon('cache'),
        link: commonTransforms.getLink(id, 'cache'),
        styleClass: commonTransforms.getStyleClass('cache'),
        text: 'Open Cached Webpage',
        type: 'cache'
      }],
      details: []
    };

    offer.details.push({
      name: 'Url',
      link: url || null,
      text: url || 'Unavailable'
    });
    offer.details.push({
      name: 'Description',
      text: offer.description
    });
    offer.details.push({
      name: 'Cached Webpage',
      link: id ? commonTransforms.getLink(id, 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    return offer;
  }

  function offsetDatesInObjects(dateObjects) {
    var sorted = _.sortBy(dateObjects, [function(o) { return o.date; }]);
    for(var i = 1; i < sorted.length; i++) {
      if(sorted[i] === sorted[i - 1]) {
        sorted[i] = {
          count: sorted[i].count,
          date: new Date(sorted[i].date.getTime() + 300)
        };
      }
    }

    return sorted;
  }

  function createLocationTimelineNotes(bucket) {
    var notes = [];

    if(bucket.publishers) {
      var publishers = getPublishersFromList(bucket.publishers.buckets);
      if(publishers.length) {
        notes.push({
          name: 'Websites',
          data: publishers
        });
      }
    }

    if(bucket.phones) {
      var phones = getPhonesFromList(bucket.phones.buckets);
      if(phones.length) {
        notes.push({
          name: 'Telephone Numbers',
          data: phones
        });
      }
    }

    if(bucket.emails) {
      var emails = getEmailsFromList(bucket.emails.buckets);
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
  function createLocationTimeline(buckets, onlyId) {
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

        dateBucket.locations = bucket.locations.buckets.map(function(locationBucket) {
          sum += locationBucket.doc_count;
          var locationObject = getUniqueLocation(locationBucket);
          if(locationObject.textAndCount) {
            subtitle.push({
              id: locationObject.id,
              text: locationObject.textAndCount
            });
          }
          locationObject.notes = createLocationTimelineNotes(locationBucket);
          return locationObject;
        });

        if(sum < bucket.doc_count) {
          var count = bucket.doc_count - sum;
          var text = 'Unknown Location(s)';
          var textAndCount = text + ' (' + (count) + ')';
          subtitle.push({
            text: textAndCount
          });
          dateBucket.locations.push({
            count: count,
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            text: text,
            textAndCount: textAndCount,
            type: 'location',
            notes: []
          });
        }

        if(onlyId) {
          dateBucket.locations = dateBucket.locations.filter(function(locationObject) {
            return locationObject.id === onlyId;
          });

          subtitle = subtitle.filter(function(item) {
            return item.id === onlyId;
          });

          if(!dateBucket.locations.length) {
            return;
          }
        }

        dateBucket.subtitle = subtitle[0].text + (subtitle.length > 1 ? (' and ' + (subtitle.length - 1) + ' more') : '');
        timeline.push(dateBucket);
      }
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      return timeline;
    }, []);

    // Sort oldest first.
    timeline.sort(function(a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return timeline;
  }

  function getTitle(length, name, suffix) {
    return (length || 'No') + ' ' + name + (length === 1 ? '' : (suffix || 's'));
  }

  return {
    offer: function(data) {
      if(data && data.hits.hits.length > 0) {
        return getOfferObject(data.hits.hits[0]);
      }
      return {};
    },

    offers: function(data) {
      var offers = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var offer = getOfferObject(record);
          offers.data.push(offer);
        });
        offers.count = data.hits.total;
      }
      return offers;
    },

    removeDescriptorFromOffers: function(descriptorId, offers) {
      var filterFunction = function(descriptor) {
        return descriptor.id !== descriptorId;
      };

      return offers.map(function(offer) {
        offer.emails = offer.emails.filter(filterFunction);
        offer.phones = offer.phones.filter(filterFunction);
        offer.prices = offer.prices.filter(filterFunction);
        offer.locations = offer.locations.filter(filterFunction);
        return offer;
      });
    },

    removeNoteFromLocationTimeline: function(noteItemId, oldTimeline) {
      var newTimeline = oldTimeline.map(function(date) {
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

      // Sort newest first.
      newTimeline.sort(function(a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return newTimeline;
    },

    locationTimeline: function(data, onlyId) {
      return {
        dates: (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets, onlyId) : undefined
      };
    },

    createEventDropsTimeline: function(data, locationId) {
      var locations = [];
      var dates = [];
      var locationIdToDates = {};

      if(data && data.aggregations) {
        data.aggregations.locations.locations.buckets.forEach(function(locationBucket) {
          var city = locationBucket.key;

          locationIdToDates[city] = locationIdToDates[city] || [];

          locationBucket.dates.buckets.forEach(function(dateBucket) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            if(dateBucket.key && dateBucket.doc_count > 0) {
              locationIdToDates[city].push({
                date: new Date(dateBucket.key),
                count: dateBucket.doc_count
              });
              dates.push(dateBucket.key);
            }
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          });
        });
      }

      _.keys(locationIdToDates).forEach(function(city) {
        var locationDates = offsetDatesInObjects(locationIdToDates[city]);

        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var location = getUniqueLocation({
          doc_count: locationIdToDates[city].reduce(function(count, dateObject) {
            return count + dateObject.count;
          }, 0),
          key: city
        });
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

        location.name = location.text;
        location.dates = locationDates.map(function(dateObject) {
          return {
            count: dateObject.count,
            date: dateObject.date,
            name: name
          };
        });

        locations.push(location);
      });

      var locationWithId = !locationId ? locations : locations.filter(function(location) {
        return location.id === locationId;
      });

      var otherLocations = !locationId ? locations : locations.filter(function(location) {
        return location.id !== locationId;
      });

      return {
        dates: dates,
        locations: locationWithId,
        allLocations: locations,
        otherLocations: otherLocations
      };
    },

    offerPhones: function(data, ignoreId) {
      var phones = [];
      var ignore = false;
      if(data && data.aggregations && data.aggregations.phone && data.aggregations.phone.phone) {
        phones = getPhonesFromList(data.aggregations.phone.phone.buckets || []).filter(function(phone) {
          ignore = ignore || phone.key === ignoreId;
          return phone.key !== ignoreId;
        });
      }
      return {
        title: getTitle(phones.length, 'Telephone Number'),
        phone: phones
      };
    },

    offerEmails: function(data, ignoreId) {
      var emails = [];
      var ignore = false;
      if(data && data.aggregations && data.aggregations.email && data.aggregations.email.email) {
        emails = getEmailsFromList(data.aggregations.email.email.buckets || []).filter(function(email) {
          ignore = ignore || email.key === ignoreId;
          return email.key !== ignoreId;
        });
      }
      return {
        title: getTitle(emails.length, 'Email Address', 'es'),
        email: emails
      };
    },

    providerAttributes: function(data) {
      var output = [];
      if(data && data.aggregations && data.aggregations.attribute && data.aggregations.attribute.attribute) {
        output = getProviderAttributesFromList(data.aggregations.attribute.attribute.buckets || []);
      }
      return {
        data: output
      };
    },

    offerPublishers: function(data) {
      var publishers = [];
      if(data && data.aggregations && data.aggregations.publisher && data.aggregations.publisher.publisher) {
        publishers = getPublishersFromList(data.aggregations.publisher.publisher.buckets || []);
      }
      return {
        title: getTitle(publishers.length, 'Website'),
        publisher: publishers
      };
    },

    offerLocationsTitle: function(data) {
      return getTitle(data.length, 'Location');
    },

    offerLocations: function(data) {
      var locations = [];
      if(data && data.aggregations && data.aggregations.location && data.aggregations.location.location) {
        locations = getUniqueLocationsFromList(data.aggregations.location.location.buckets || []);
      }
      return {
        title: getTitle(locations.length, 'Location'),
        location: locations
      };
    },

    locationPageMap: function(locationId, data) {
      if(!locationId || !data || !data.length) {
        // need to return undefined here so that we wait until all data is ready before displaying points on the map
        return undefined;
      }

      return data.map(function(location) {
        if(location.id === locationId) {
          location.iconId = 'mainLocation';
        }
        return location;
      });
    },

    createExportData: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [[
        'ad url',
        'dig url',
        'title',
        'date',
        'publisher',
        'locations',
        'telephone numbers',
        'email addresses',
        'images',
        'description'
      ]];
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
        // TODO
        var images = '';
        data.push([
          result.url,
          linkPrefix + result.link,
          result.title,
          result.date.text,
          result.publishers.length ? result.publishers[0].text : '',
          locations,
          phones,
          emails,
          images,
          result.description.replace(/\n/g, ' ')
        ]);
      });
      return data;
    }
  };
});
