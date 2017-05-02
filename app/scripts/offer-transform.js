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

  function getRawFieldDataFromRecord(record, path) {
    var strict = _.get(record, path + '.strict', []);
    var strictKeys = strict.map(function(item) {
      return item.key;
    });

    // Relaxed is a superset of strict.  Remove all items from relaxed that exist in strict for this use case.
    var relaxed = _.get(record, path + '.relaxed', []).filter(function(item) {
      return strictKeys.indexOf(item.key) < 0;
    });

    // TODO Ignore relaxed for now.
    relaxed = [];

    return {
      relaxed: relaxed,
      strict: strict
    };
  }

  function getSingleStringFromRecord(record, path) {
    var getSingleString = function(list) {
      return list.length ? list.map(function(item) {
        return item.name;
      }).join('\n') : undefined;
    };

    var data = getRawFieldDataFromRecord(record, path);
    return getSingleString(data.strict) || getSingleString(data.relaxed);
  }

  function annotateType(type) {
    return type === 'email' || type === 'phone';
  }

  function getIdOfType(key, name, type) {
    if(type === 'location') {
      // TODO We should use the key (and ignore the name) once the extractions are improved.
      return key || name;
    }
    if(type === 'social') {
      return key.indexOf(' ') ? key.substring(key.indexOf(' ') + 1) : key;
    }
    return key;
  }

  function getTextOfType(key, name, type) {
    if(type === 'date') {
      return commonTransforms.getDate(name || key) || 'No Date';
    }
    if(type === 'email') {
      return decodeURIComponent(name || key);
    }
    if(type === 'phone') {
      return commonTransforms.getFormattedPhone(name || key);
    }
    if(type === 'provider' || type === 'review' || type === 'service' || type === 'social') {
      return name ? ('' + name).toLowerCase() : ('' + key).toLowerCase();
    }
    return name || key;
  }

  function getExtractionOfType(item, type, confidence) {
    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var count = item.doc_count;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
    var extraction = {
      annotate: annotateType(type),
      confidence: confidence,
      count: count,
      id: getIdOfType(item.key, item.name, type),
      icon: commonTransforms.getIronIcon(type),
      link: commonTransforms.getLink(item.key, type),
      styleClass: commonTransforms.getStyleClass(type),
      text: getTextOfType(item.key, item.name, type),
      type: type
    };
    if(type === 'location') {
      var locationData = commonTransforms.getLocationDataFromId(extraction.id);
      extraction.latitude = locationData.latitude;
      extraction.longitude = locationData.longitude;
      extraction.text = locationData.text;
      extraction.textAndCount = locationData.text + (extraction.count ? (' (' + extraction.count + ')') : '');
      extraction.textAndCountry = locationData.text + (locationData.country ? (', ' + locationData.country) : '');
    }
    return extraction;
  }

  function getFilterFunctionOfType(type) {
    if(type === 'location') {
      // TODO Filter out the bad locations once the extractions are improved.
      //return commonTransforms.isGoodLocation;
    }
    if(type === 'money') {
      return function(item) {
        return item.text !== '-per-min';
      };
    }
    return null;
  }

  function getExtractionsFromListOfType(extractionList, type, confidence) {
    var extractionData = extractionList.map(function(item) {
      return getExtractionOfType(item, type, confidence);
    });
    var filterFunction = getFilterFunctionOfType(type);
    return (filterFunction ? extractionData.filter(filterFunction) : extractionData);
  }

  function getExtractionsFromRecordOfType(record, path, type) {
    var data = getRawFieldDataFromRecord(record, path);
    var strictData = getExtractionsFromListOfType(data.strict, type, 'strict');
    var relaxedData = getExtractionsFromListOfType(data.relaxed, type, 'relaxed');
    return strictData.concat(relaxedData);
  }

  function getHighRisk(record, path) {
    var data = getRawFieldDataFromRecord(record, path);
    var highRisk = data.strict.some(function(risk) {
      return risk.name.toLowerCase() === 'yes';
    });
    return highRisk ? 'High Risk' : '';
  }

  function getHighlightedText(record, paths) {
    var path = _.find(paths, function(path) {
      return record.highlight && record.highlight[path] && record.highlight[path].length && record.highlight[path][0];
    });
    return path ? record.highlight[path][0] : undefined;
  }

  function addHighlights(data, record, paths) {
    if(record.highlight) {
      var cleanHighlight = function(text, path) {
        var skipPathsForPartialMatches = ['tld', 'fields.email.strict.name', 'fields.email.relaxed.name'];
        if(skipPathsForPartialMatches.indexOf(path) >= 0 && (!_.startsWith(text, '<em>') || !_.endsWith(text, '</em>'))) {
          return text.toLowerCase();
        }
        var output = text;
        if(path === 'fields.social_media_id.strict.name' || path === 'fields.social_media_id.relaxed.name') {
          output = output.indexOf(' ') ? output.substring(output.indexOf(' ') + 1) : output;
        }
        return output.indexOf('<em>') >= 0 ? output.replace(/<\/?em\>/g, '').toLowerCase() : '';
      };

      var highlights = {};

      paths.forEach(function(path) {
        if(record.highlight[path] && record.highlight[path].length) {
          record.highlight[path].forEach(function(highlight) {
            var cleanedHighlight = cleanHighlight(highlight, path);
            if(cleanedHighlight) {
              highlights[cleanedHighlight] = true;
            }
          });
        }
      });

      _.keys(highlights).forEach(function(highlight) {
        data.forEach(function(item) {
          if(item.id && ('' + item.id).toLowerCase().indexOf(highlight) >= 0) {
            item.highlight = true;
          }
        });
      });
    }
    return data;
  }

  function getOfferObject(record) {
    var id = _.get(record, '_source.doc_id');
    var url = _.get(record, '_source.url');

    if(!id || !url) {
      return {};
    }

    var rank = _.get(record, '_score');
    var domain = _.get(record, '_source.tld');

    var offer = {
      id: id,
      url: url,
      rank: rank ? rank.toFixed(2) : rank,
      domain: domain || 'No Domain',
      type: 'offer',
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      flag: getHighRisk(record, '_source.fields.risk'),
      title: getSingleStringFromRecord(record, '_source.fields.title') || 'No Title',
      description: getSingleStringFromRecord(record, '_source.fields.description') || 'No Description',
      locations: getExtractionsFromRecordOfType(record, '_source.fields.city', 'location'),
      phones: getExtractionsFromRecordOfType(record, '_source.fields.phone', 'phone'),
      emails: getExtractionsFromRecordOfType(record, '_source.fields.email', 'email'),
      socialIds: getExtractionsFromRecordOfType(record, '_source.fields.social_media_id', 'social'),
      reviewIds: getExtractionsFromRecordOfType(record, '_source.fields.review_id', 'review'),
      services: getExtractionsFromRecordOfType(record, '_source.fields.service', 'service'),
      prices: getExtractionsFromRecordOfType(record, '_source.fields.price', 'money'),
      names: getExtractionsFromRecordOfType(record, '_source.fields.name', 'provider'),
      genders: getExtractionsFromRecordOfType(record, '_source.fields.gender', 'provider'),
      ages: getExtractionsFromRecordOfType(record, '_source.fields.age', 'provider'),
      ethnicities: getExtractionsFromRecordOfType(record, '_source.fields.ethnicity', 'provider'),
      eyeColors: getExtractionsFromRecordOfType(record, '_source.fields.eye_color', 'provider'),
      hairColors: getExtractionsFromRecordOfType(record, '_source.fields.hair_color', 'provider'),
      heights: getExtractionsFromRecordOfType(record, '_source.fields.height', 'provider'),
      weights: getExtractionsFromRecordOfType(record, '_source.fields.weight', 'provider'),
      dates: getExtractionsFromListOfType([{
        key: getSingleStringFromRecord(record, '_source.fields.posting_date')
      }], 'date'),
      publishers: getExtractionsFromListOfType([{
        key: domain
      }], 'webpage'),
      webpages: getExtractionsFromListOfType([{
        key: url
      }], 'webpage'),
      caches: getExtractionsFromListOfType([{
        key: id,
        name: 'Open Cached Ad Webpage'
      }], 'cache'),
      highlightedText: getHighlightedText(record, ['fields.title.strict.name', 'fields.title.relaxed.name']),
      details: []
    };

    offer.date = offer.dates.length ? offer.dates[0].text : 'Unknown Date';

    // Handle highlighted text.
    offer.locations = addHighlights(offer.locations, record, [
        'fields.city.strict.name',
        'fields.city.relaxed.name',
        'fields.state.strict.name',
        'fields.state.relaxed.name',
        'fields.country.strict.name',
        'fields.country.relaxed.name'
    ]);
    offer.phones = addHighlights(offer.phones, record, ['fields.phone.strict.name', 'fields.phone.relaxed.name']);
    offer.emails = addHighlights(offer.emails, record, ['fields.email.strict.name', 'fields.email.relaxed.name']);
    offer.socialIds = addHighlights(offer.socialIds, record, ['fields.social_media_id.strict.name', 'fields.social_media_id.relaxed.name']);
    offer.reviewIds = addHighlights(offer.reviewIds, record, ['fields.review_id.strict.name', 'fields.review_id.relaxed.name']);
    offer.services = addHighlights(offer.services, record, ['fields.service.strict.name', 'fields.service.relaxed.name']);
    offer.prices = addHighlights(offer.prices, record, ['fields.price.strict.name', 'fields.price.relaxed.name']);
    offer.names = addHighlights(offer.names, record, ['fields.name.strict.name', 'fields.name.relaxed.name']);
    offer.genders = addHighlights(offer.genders, record, ['fields.gender.strict.name', 'fields.gender.relaxed.name']);
    offer.ages = addHighlights(offer.ages, record, ['fields.age.strict.name', 'fields.age.relaxed.name']);
    offer.ethnicities = addHighlights(offer.ethnicities, record, ['fields.ethnicity.strict.name', 'fields.ethnicity.relaxed.name']);
    offer.eyeColors = addHighlights(offer.eyeColors, record, ['fields.eye_color.strict.name', 'fields.eye_color.relaxed.name']);
    offer.hairColors = addHighlights(offer.hairColors, record, ['fields.hair_color.strict.name', 'fields.hair_color.relaxed.name']);
    offer.heights = addHighlights(offer.heights, record, ['fields.height.strict.name', 'fields.height.relaxed.name']);
    offer.weights = addHighlights(offer.weights, record, ['fields.weight.strict.name', 'fields.weight.relaxed.name']);
    offer.publishers = addHighlights(offer.publishers, record, ['tld']);

    // Handle extraction arrays for single-record elements.
    offer.headerExtractions = [{
      data: offer.dates
    }, {
      data: offer.publishers
    }, {
      data: offer.locations,
      name: 'Locations'
    }, {
      data: offer.phones,
      name: 'Telephone Numbers'
    }, {
      data: offer.emails,
      name: 'Email Addresses'
    }, {
      data: offer.socialIds,
      name: 'Social Media IDs'
    }];
    offer.detailExtractions = [{
      data: offer.reviewIds,
      name: 'Review IDs'
    }, {
      data: offer.services,
      name: 'Services Provided'
    }, {
      data: offer.prices,
      name: 'Prices'
    }, {
      data: offer.names,
      name: 'Provider Names'
    }, {
      data: offer.ages,
      name: 'Provider Ages'
    }, {
      data: offer.ethnicities,
      name: 'Provider Ethnicities'
    }, {
      data: offer.eyeColors,
      name: 'Provider Eye Colors'
    }, {
      data: offer.hairColors,
      name: 'Provider Hair Colors'
    }, {
      data: offer.heights,
      name: 'Provider Heights'
    }, {
      data: offer.weights,
      name: 'Provider Weights'
    }];

    // Handle detail arrays for single-record elements.
    offer.details.push({
      name: 'Url',
      link: url || null,
      text: url || 'Unavailable'
    });
    offer.details.push({
      name: 'Description',
      highlightedText: getHighlightedText(record, ['fields.description.strict.name', 'fields.description.relaxed.name']),
      text: offer.description
    });
    offer.details.push({
      name: 'Cached Ad Webpage',
      link: id ? commonTransforms.getLink(id, 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    return offer;
  }

  function getTitle(size, type, sayOther) {
    return (size || 'No') + (sayOther ? ' Other ' : ' ') + commonTransforms.getName(type, size !== 1);
  }

  return {
    offer: function(data) {
      if(data && data.hits.hits.length > 0) {
        return getOfferObject(data.hits.hits[0]);
      }
      return {};
    },

    offers: function(data) {
      var offers = [];
      if(data && data.hits.hits.length > 0) {
        data.hits.hits.forEach(function(record) {
          offers.push(getOfferObject(record));
        });
      }
      return offers;
    },

    removeExtractionFromOffers: function(extractionId, offers) {
      var helperFunction = function(item) {
        return {
          data: item.data.filter(function(extraction) {
            return extraction.id !== extractionId;
          }),
          name: item.name
        };
      };

      return offers.map(function(offer) {
        offer.headerExtractions = offer.headerExtractions.map(helperFunction);
        offer.detailExtractions = offer.detailExtractions.map(helperFunction);
        return offer;
      });
    },

    offerExtractions: function(data, config) {
      var ignoreId = config ? config.ignoreId : undefined;
      var property = config ? config.property : undefined;
      var type = config ? config.type : undefined;

      var extractions = [];
      var sayOther = false;

      if(data && data.aggregations && data.aggregations[property] && data.aggregations[property][property]) {
        extractions = getExtractionsFromListOfType(data.aggregations[property][property].buckets || [], type).filter(function(extraction) {
          var result = ignoreId ? extraction.id !== ignoreId : true;
          sayOther = sayOther || !result;
          return result;
        });
      }

      return extractions;
    },

    offerExtractionsTitle: function(size, config) {
      return getTitle(size, config.type, config.sayOther);
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

    revisions: function(data) {
      if(data && data.aggregations) {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var total = data.aggregations.revisions.doc_count;
        var revisions = _.map(data.aggregations.revisions.revisions.buckets, function(bucket) {
          return {
            date: commonTransforms.getDate(bucket.key_as_string),
            list: [{
              count: bucket.doc_count,
              label: 'Revision on ' + commonTransforms.getDate(bucket.key_as_string)
            }]
          };
        });
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        return (total < 2 ? [] : revisions);
      }
      return [];
    },

    getExtractionOfType: function(list, type, confidence) {
      return getExtractionOfType(list, type, confidence);
    },

    getExtractionsFromListOfType: function(list, type, confidence) {
      return getExtractionsFromListOfType(list, type, confidence);
    },

    /**
     * Returns the formatted telephone number.
     */
    formattedTelephoneNumber: function(number) {
      return commonTransforms.getFormattedPhone(number);
    }
  };
});
