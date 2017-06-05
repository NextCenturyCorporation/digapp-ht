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

/* exported timelineTransform */
/* jshint camelcase:false */

var timelineTransform = (function(_, commonTransforms, offerTransform) {

  function sortAndOffsetDates(dateObjects) {
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

  function createDetailsFromLocationBucket(locationBucket) {
    var details = [];

    if(locationBucket.publishers) {
      var publishers = offerTransform.getExtractionsFromListOfType(locationBucket.publishers.buckets, 'webpage');
      if(publishers.length) {
        details.push({
          name: 'Websites',
          data: publishers
        });
      }
    }

    if(locationBucket.phones) {
      var phones = offerTransform.getExtractionsFromListOfType(locationBucket.phones.buckets, 'phone');
      if(phones.length) {
        details.push({
          name: 'Telephone Numbers',
          data: phones
        });
      }
    }

    if(locationBucket.emails) {
      var emails = offerTransform.getExtractionsFromListOfType(locationBucket.emails.buckets, 'email');
      if(emails.length) {
        details.push({
          name: 'Email Addresses',
          data: emails
        });
      }
    }

    return details;
  }

  function createLocationsFromDateBucket(dateBucket) {
    return dateBucket.locations.buckets.map(function(locationBucket) {
      var locationObject = offerTransform.getExtractionOfType(locationBucket, 'location');
      locationObject.details = createDetailsFromLocationBucket(locationBucket);
      return locationObject;
    }).filter(function(location) {
      return commonTransforms.isGoodLocation(location);
    });
  }

  function createLocationTimelineDate(dateBucket) {
    return {
      date: commonTransforms.getDate(dateBucket.key),
      icon: commonTransforms.getIronIcon('date'),
      locations: createLocationsFromDateBucket(dateBucket),
      styleClass: commonTransforms.getStyleClass('date')
    };
  }

  function createUnknownLocation(count) {
    var text = 'Unknown Location(s)';
    var textAndCount = text + ' (' + (count) + ')';
    return {
      count: count,
      icon: commonTransforms.getIronIcon('location'),
      styleClass: commonTransforms.getStyleClass('location'),
      text: text,
      textAndCount: textAndCount,
      type: 'location',
      details: []
    };
  }

  function createSubtitle(locations) {
    if(!locations.length) {
      return '';
    }

    var subtitle = [];
    locations.forEach(function(locationObject) {
      subtitle.push({
        id: locationObject.id,
        text: locationObject.textAndCount
      });
    });
    return subtitle[0].text + (subtitle.length > 1 ? (' and ' + (subtitle.length - 1) + ' more') : '');
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and details for each location.
   */
  function createLocationTimeline(buckets, onlyId) {
    var timeline = buckets.reduce(function(timeline, dateBucket) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = dateBucket.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      if(count) {
        var dateObject = createLocationTimelineDate(dateBucket);

        var sum = dateObject.locations.reduce(function(sum, locationObject) {
          return sum + locationObject.count;
        }, 0);

        if(sum < count) {
          dateObject.locations.push(createUnknownLocation(count - sum));
        }

        // Filter out the locations that do not match the onlyId.  Do this after the unknown location is created.
        if(onlyId) {
          dateObject.locations = dateObject.locations.filter(function(locationObject) {
            return locationObject.id === onlyId;
          });
        }

        // The locations may be empty if none match the onlyId.
        if(!dateObject.locations.length) {
          return;
        }

        dateObject.subtitle = createSubtitle(dateObject.locations);
        timeline.push(dateObject);
      }

      return timeline;
    }, []);

    // Sort oldest first.
    timeline.sort(function(a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return {
      dates: timeline
    };
  }

  function findEventDropsDatesAndLocations(buckets, locationId) {
    var dates = [];
    var locationIdToDateList = {};

    buckets.forEach(function(locationBucket) {
      var id = locationBucket.key;
      locationIdToDateList[id] = locationIdToDateList[id] || [];

      locationBucket.dates.buckets.forEach(function(dateBucket) {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var count = dateBucket.doc_count;
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        if(dateBucket.key && count > 0) {
          locationIdToDateList[id].push({
            count: count,
            date: new Date(dateBucket.key)
          });
          // If locationId is defined, only use dates of locations with that ID.
          if(!locationId || _.isEmpty(locationId) || locationId === id) {
            dates.push(dateBucket.key);
          }
        }
      });
    });

    return {
      dates: dates,
      locationIdToDateList: locationIdToDateList
    };
  }

  function createEventDropsLocations(locationIdToDateList) {
    var locations = [];

    _.keys(locationIdToDateList).forEach(function(id) {
      var locationDates = sortAndOffsetDates(locationIdToDateList[id]);

      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var location = offerTransform.getExtractionOfType({
        doc_count: locationIdToDateList[id].reduce(function(sum, dateObject) {
          return sum + dateObject.count;
        }, 0),
        key: id
      }, 'location');
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      if(commonTransforms.isGoodLocation(location)) {
        location.name = location.text;
        location.dates = locationDates.map(function(dateObject) {
          return {
            count: dateObject.count,
            date: dateObject.date,
            name: location.name
          };
        });
        locations.push(location);
      }
    });

    return locations;
  }

  function createEventDropsTimeline(buckets, locationId) {
    var data = findEventDropsDatesAndLocations(buckets, locationId);

    var locations = createEventDropsLocations(data.locationIdToDateList);

    var locationWithId = (!locationId || _.isEmpty(locationId)) ? locations : locations.filter(function(location) {
      return location.id === locationId;
    });

    return {
      dates: data.dates,
      locations: locationWithId
    };
  }

  return {
    removeDetailFromLocationTimeline: function(detailItemId, oldTimeline) {
      var newTimeline = oldTimeline.map(function(date) {
        date.locations = date.locations.map(function(location) {
          location.details = location.details.map(function(detail) {
            var previousLength = detail.data.length;
            detail.data = detail.data.filter(function(item) {
              return item.id !== detailItemId;
            });
            if(detail.data.length < previousLength) {
              detail.name = 'Other ' + detail.name;
            }
            return detail;
          });
          // Remove any details that no longer have any data.
          location.details = location.details.filter(function(detail) {
            return detail.data.length;
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
      return (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets, onlyId) : {};
    },

    filteredLocationTimeline: function(data, onlyId) {
      return (data && data.aggregations) ? createLocationTimeline(data.aggregations.filteredDates.filteredDates.buckets, onlyId) : {};
    },

    eventDropsTimeline: function(data, locationId) {
      return (data && data.aggregations) ? createEventDropsTimeline(data.aggregations.locations.locations.buckets, locationId) : {};
    }
  };
});
