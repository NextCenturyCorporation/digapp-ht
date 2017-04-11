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

var offerTransform = (function(_, commonTransforms, providerTransforms) {

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
      var key = _.get(location, 'key');
      var locality = _.get(location, 'addressLocality');
      var region = _.get(location, 'addressRegion');
      var country = _.get(location, 'addressCountry');
      var latitude = _.get(location, 'geo.latitude');
      var longitude = _.get(location, 'geo.longitude');

      return {
        key: key,
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
      if(type === 'phone') {
        if(text.startsWith('1-')) {
          text = text.substring(2);
        }
        text = text.replace(/(\d{0,4})-?(\d{3})(\d{3})(\d{4})/, function(match, p1, p2, p3, p4) {
          if(p2 && p3 && p4) {
            return (p1 ? p1 + '-' : '') + p2 + '-' + p3 + '-' + p4;
          }
          return p1 + p2 + p3 + p4;
        });
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

    var offer = {
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
      person: providerTransforms.personFromRecord(_.get(record, entityPath + '.itemOffered')),
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
        text: 'Open Cached Webpage',
        icon: commonTransforms.getIronIcon('cache'),
        link: commonTransforms.getLink(cacheId, 'cache'),
        styleClass: commonTransforms.getStyleClass('cache')
      }] : [],
      descriptors: [],
      details: []
    };

    offer.name = _.isArray(offer.name) ? offer.name.join(', ') : offer.name;
    offer.location = offer.locations.length ? offer.locations[0].text : 'No Location';

    var locationKey = offer.locations.length ? offer.locations[0].key : undefined;
    offer.locationDescriptor = {
      icon: commonTransforms.getIronIcon('location'),
      styleClass: commonTransforms.getStyleClass('location'),
      text: offer.location,
      link: commonTransforms.getLink(locationKey, 'location'),
      type: 'location'
    };

    offer.descriptors.push({
      icon: commonTransforms.getIronIcon('date'),
      styleClass: commonTransforms.getStyleClass('date'),
      type: 'date',
      text: offer.date
    });
    offer.descriptors.push({
      icon: commonTransforms.getIronIcon('webpage'),
      styleClass: commonTransforms.getStyleClass('webpage'),
      type: 'webpage',
      text: offer.publisher
    });

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
      link: cacheId ? commonTransforms.getLink(cacheId, 'cache') : null,
      text: cacheId ? 'Open' : 'Unavailable'
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
            link: commonTransforms.getLink(locationBucket.key, 'location'),
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

    // Sort oldest first.
    timeline.sort(function(a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
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
        count: bucket.doc_count,
        styleClass: commonTransforms.getStyleClass('provider')
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

  function offerSplitLocations(locationBucket) {
    var locationData = locationBucket.key.split(':');
    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var location = {
      key: locationBucket.key,
      count: locationBucket.doc_count,
      longitude: locationData[3],
      latitude: locationData[4],
      name: locationData[0] + ', ' + locationData[1],
      longName: locationData[0] + ', ' + locationData[1] + ', ' + locationData[2] + ' (' + locationBucket.doc_count + ')',
      link: commonTransforms.getLink(locationBucket.key, 'location'),
      styleClass: commonTransforms.getStyleClass('location')
    };
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
    return location;
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
          var offer = getOfferObject(record, '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
          offers.data.push(offer);
        });
        offers.count = data.hits.total;
      }
      return offers;
    },

    offersData: function(data) {
      var offers = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var offer = getOfferObject(record, '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
          offers.data.push(offer);
        });
        offers.count = data.hits.total;
      }
      return offers.data;
    },

    offerFromRecordAndPaths: function(record, mainPath, idPath, datePath, entityPath) {
      return getOfferObject(record, mainPath, idPath, datePath, entityPath);
    },

    removeDescriptorFromOffers: function(descriptorId, offers) {
      var filterFunction = function(descriptor) {
        return descriptor.id !== descriptorId;
      };

      return offers.map(function(offer) {
        offer.descriptors = offer.descriptors.filter(filterFunction);
        offer.emails = offer.emails.filter(filterFunction);
        offer.phones = offer.phones.filter(filterFunction);
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

    locationTimeline: function(data) {
      return {
        dates: (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets) : undefined
      };
    },

    gatherEventDropsTimelineData: function(data) {
      var eventDropsTimelineData = [];
      var timestamps = [];

      if(data && data.aggregations) {
        var cityAggs = {};

        data.aggregations.locations.locations.buckets.forEach(function(locationBucket) {
          var city = locationBucket.key;

          if(!(city in cityAggs)) {
            cityAggs[city] = [];
          }

          locationBucket.dates.buckets.forEach(function(dateBucket) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            if(dateBucket.key && dateBucket.doc_count > 0) {
              cityAggs[city].push({
                date: new Date(dateBucket.key),
                count: dateBucket.doc_count
              });
              timestamps.push(dateBucket.key);
            }
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          });
        });

        _.keys(cityAggs).forEach(function(city) {
          var nameList = city.split(':');
          var name = nameList[0] + ', ' + nameList[1];
          name = name.length < 25 ? name : nameList[0];

          var dateObjects = offsetDatesInObjects(cityAggs[city]).map(function(dateObject) {
            return {
              count: dateObject.count,
              date: dateObject.date,
              name: name
            };
          });

          eventDropsTimelineData.push({
            name: name,
            dates: dateObjects
          });
        });
      }

      return {
        data: eventDropsTimelineData,
        timestamps: timestamps
      };
    },

    offerPhones: function(data, ignoreId) {
      var phones = [];
      var maxCount;
      var ignoreName;
      if(data && data.aggregations) {
        data.aggregations.phone.phone.buckets.forEach(function(bucket) {
          var text = bucket.key.substring(bucket.key.lastIndexOf('/') + 1);
          if(text.startsWith('1-')) {
            text = text.substring(2);
          }
          text = text.replace(/(\d{0,4})-?(\d{3})(\d{3})(\d{4})/, function(match, p1, p2, p3, p4) {
            if(p2 && p3 && p4) {
              return (p1 ? p1 + '-' : '') + p2 + '-' + p3 + '-' + p4;
            }
            return p1 + p2 + p3 + p4;
          });
          if(ignoreId !== bucket.key) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            maxCount = maxCount || bucket.doc_count;
            phones.push({
              id: bucket.key,
              count: bucket.doc_count,
              link: commonTransforms.getLink(bucket.key, 'phone'),
              max: maxCount,
              styleClass: commonTransforms.getStyleClass('phone'),
              text: text
            });
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          } else {
            ignoreName = text;
          }
        });
      }
      return {
        title: (phones.length || 'No') + (ignoreName ? ' Other' : '') + ' Telephone Number' + (phones.length === 1 ? '' : 's'),
        phone: phones
      };
    },

    offerEmails: function(data, ignoreId) {
      var emails = [];
      var maxCount;
      var ignoreName;
      if(data && data.aggregations) {
        data.aggregations.email.email.buckets.forEach(function(bucket) {
          var text = decodeURIComponent(bucket.key.substring(bucket.key.lastIndexOf('/') + 1));
          if(ignoreId !== bucket.key) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            maxCount = maxCount || bucket.doc_count;
            emails.push({
              id: bucket.key,
              count: bucket.doc_count,
              link: commonTransforms.getLink(bucket.key, 'email'),
              max: maxCount,
              styleClass: commonTransforms.getStyleClass('email'),
              text: text
            });
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          } else {
            ignoreName = text;
          }
        });
      }
      return {
        title: (emails.length || 'No') + (ignoreName ? ' Other' : '') + ' Email Address' + (emails.length === 1 ? '' : 'es'),
        email: emails
      };
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

    offerPublishers: function(data) {
      var publishers = [];
      (data && data.aggregations ? data.aggregations.publisher.publisher.buckets : []).forEach(function(publisherBucket) {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        publishers.push({
          id: publisherBucket.key,
          count: publisherBucket.doc_count,
          styleClass: commonTransforms.getStyleClass('webpage')
        });
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });

      return {
        title: (publishers.length || 'No') + ' Website' + (publishers.length === 1 ? '' : 's'),
        publisher: publishers
      };
    },

    offerLocations: function(data) {
      var locations = [];
      (data && data.aggregations ? data.aggregations.location.location.buckets : []).forEach(function(locationBucket) {
        locations.push(offerSplitLocations(locationBucket));
      });

      return {
        title: (locations.length || 'No') + ' Location' + (locations.length === 1 ? '' : 's'),
        location: locations
      };
    },

    similarLocations: function(currentLocation, data) {
      var similarLocations = [];
      (data && data.aggregations ? data.aggregations.similarLocsAgg.similarLocsAgg.cityAgg.buckets : []).forEach(function(locationBucket) {
        // omit current location used to display entity page
        if(locationBucket.key !== currentLocation) {
          similarLocations.push(offerSplitLocations(locationBucket));
        }
      });

      return {
        similarLocations: similarLocations
      };
    },

    locationPageMap: function(currentLocation, data) {
      if(!currentLocation || !data || !data.aggregations) {
        return {
          // need to return undefined here so that we wait until all data is ready before displaying points on the map
          mapLocations: undefined
        };
      }

      var mapLocations = [];

      (data && data.aggregations ? data.aggregations.similarLocsAgg.similarLocsAgg.cityAgg.buckets : []).forEach(function(locationBucket) {
        if(locationBucket.key === currentLocation.key) {
          var location = offerSplitLocations(locationBucket);
          location.iconId = 'mainLocation';
          mapLocations.push(location);
        } else {
          mapLocations.push(offerSplitLocations(locationBucket));
        }
      });

      return {
        mapLocations: mapLocations
      };
    },

    createExportDataForCsv: function(results) {
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
        var description = result.description.replace(/\s/g, ' ');
        if(description.length > 2000) {
          description = description.slice(0, 2000) + '...';
        }
        data.push([result.url, linkPrefix + result.link, result.name, result.date, result.publisher, locations, phones, emails, images, description]);
      });
      return data;
    },

    createExportDataForPdf: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [];
      var nextId = 1;

      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.text;
        }).join(', ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join(', ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join(', ');

        var item = {
          images: result.images.map(function(image) {
            return {
              id: 'image' + nextId++,
              source: encodeURIComponent(image.source.replace('https://s3.amazonaws.com/', '')),
              text: image.source
            };
          }),
          paragraphs: []
        };

        item.paragraphs.push({
          big: true,
          label: result.name,
          value: ''
        });
        item.paragraphs.push({
          label: 'Posting Date:  ',
          value: result.date
        });
        item.paragraphs.push({
          label: 'Location(s):  ',
          value: locations
        });
        item.paragraphs.push({
          label: 'Telephone Number(s):  ',
          value: phones
        });
        item.paragraphs.push({
          label: 'Email Address(es):  ',
          value: emails
        });
        item.paragraphs.push({
          label: 'Description:  ',
          value: result.description.replace(/\n/g, ' ')
        });
        item.paragraphs.push({
          label: 'URL:  ',
          value: result.url
        });
        item.paragraphs.push({
          label: 'DIG URL:  ',
          value: linkPrefix + result.link
        });

        data.push(item);
      });

      return data;
    }
  };
});
