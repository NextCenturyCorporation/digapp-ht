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

  function getSingleStringFromRecord(record, path, property) {
    var data = _.get(record, path, []);

    if(data && _.isArray(data)) {
      return data.length ? data.map(function(item) {
        return item[property];
      }).join('\n') : undefined;
    }

    return data ? data[property] : undefined;
  }

  function annotateType(type) {
    return type === 'email' || type === 'phone';
  }

  function getIdOfType(key, value, type) {
    if(type === 'location') {
      // TODO We should use the key (and ignore the value) once the extractions are improved.
      return key || value;
    }
    if(type === 'social') {
      return key.indexOf(' ') ? key.substring(key.indexOf(' ') + 1) : key;
    }
    return key;
  }

  function getTextOfType(key, value, type) {
    if(type === 'date') {
      return commonTransforms.getDate(value || key) || 'No Date';
    }
    if(type === 'email') {
      return decodeURIComponent(value || key);
    }
    if(type === 'phone') {
      return commonTransforms.getFormattedPhone(value || key);
    }
    if(type === 'provider' || type === 'review' || type === 'service' || type === 'social') {
      return value ? ('' + value).toLowerCase() : ('' + key).toLowerCase();
    }
    return value || key;
  }

  function getExtractionOfType(item, type, confidence) {
    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var count = item.doc_count;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
    var extraction = {
      annotate: annotateType(type),
      confidence: confidence,
      count: count,
      id: getIdOfType(item.key, item.value, type),
      icon: commonTransforms.getIronIcon(type),
      link: commonTransforms.getLink(item.key, type),
      styleClass: commonTransforms.getStyleClass(type),
      text: getTextOfType(item.key, item.value, type),
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
    var data = _.get(record, path, []);
    // For now, remove low confidence extractions.
    var filteredData = data.filter(function(item) {
      return item.confidence && item.confidence > 0.5;
    });
    return getExtractionsFromListOfType(filteredData, type);
  }

  function getHighRisk(record, path) {
    var data = _.get(record, path, []);
    var highRisk = data.some(function(risk) {
      return risk.value.toLowerCase() === 'yes';
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
        var skipPathsForPartialMatches = ['tld', 'knowledge_graph.email.value'];
        if(skipPathsForPartialMatches.indexOf(path) >= 0 && (!_.startsWith(text, '<em>') || !_.endsWith(text, '</em>'))) {
          return text.toLowerCase();
        }
        var output = text;
        if(path === 'knowledge_graph.social_media_id.value') {
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
      flag: getHighRisk(record, '_source.knowledge_graph.risk'),
      title: getSingleStringFromRecord(record, '_source.content_extraction.title', 'text') || 'No Title',
      description: getSingleStringFromRecord(record, '_source.content_extraction.content_strict', 'text') || 'No Description',
      locations: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.city', 'location'),
      phones: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.phone', 'phone'),
      emails: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.email', 'email'),
      socialIds: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.social_media_id', 'social'),
      reviewIds: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.review_id', 'review'),
      services: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.service', 'service'),
      prices: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.price', 'money'),
      names: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.name', 'provider'),
      genders: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.gender', 'provider'),
      ages: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.age', 'provider'),
      ethnicities: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.ethnicity', 'provider'),
      eyeColors: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.eye_color', 'provider'),
      hairColors: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.hair_color', 'provider'),
      heights: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.height', 'provider'),
      weights: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.weight', 'provider'),
      dates: getExtractionsFromListOfType([{
        key: getSingleStringFromRecord(record, '_source.knowledge_graph.posting_date', 'value')
      }], 'date'),
      publishers: getExtractionsFromListOfType([{
        key: domain
      }], 'webpage'),
      webpages: getExtractionsFromListOfType([{
        key: url
      }], 'webpage'),
      caches: getExtractionsFromListOfType([{
        key: id,
        value: 'Open Cached Ad Webpage'
      }], 'cache'),
      highlightedText: getHighlightedText(record, ['content_extraction.title.text']),
      details: []
    };

    offer.date = offer.dates.length ? offer.dates[0].text : 'Unknown Date';

    // Handle highlighted text.
    offer.locations = addHighlights(offer.locations, record, [
        'knowledge_graph.city.value',
        'knowledge_graph.state.value',
        'knowledge_graph.country.value'
    ]);
    offer.phones = addHighlights(offer.phones, record, ['knowledge_graph.phone.value']);
    offer.emails = addHighlights(offer.emails, record, ['knowledge_graph.email.value']);
    offer.socialIds = addHighlights(offer.socialIds, record, ['knowledge_graph.social_media_id.value']);
    offer.reviewIds = addHighlights(offer.reviewIds, record, ['knowledge_graph.review_id.value']);
    offer.services = addHighlights(offer.services, record, ['knowledge_graph.service.value']);
    offer.prices = addHighlights(offer.prices, record, ['knowledge_graph.price.value']);
    offer.names = addHighlights(offer.names, record, ['knowledge_graph.name.value']);
    offer.genders = addHighlights(offer.genders, record, ['knowledge_graph.gender.value']);
    offer.ages = addHighlights(offer.ages, record, ['knowledge_graph.age.value']);
    offer.ethnicities = addHighlights(offer.ethnicities, record, ['knowledge_graph.ethnicity.value']);
    offer.eyeColors = addHighlights(offer.eyeColors, record, ['knowledge_graph.eye_color.value']);
    offer.hairColors = addHighlights(offer.hairColors, record, ['knowledge_graph.hair_color.value']);
    offer.heights = addHighlights(offer.heights, record, ['knowledge_graph.height.value']);
    offer.weights = addHighlights(offer.weights, record, ['knowledge_graph.weight.value']);
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
      highlightedText: getHighlightedText(record, ['content_extraction.content_strict.text']),
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

    locationsWithIcons: function(primary, secondary) {
      if(!primary || !primary.length) {
        // need to return undefined here so that we wait until all data is ready before displaying points on the map
        return undefined;
      }

      var locations = [];

      primary.forEach(function(location) {
        location.iconId = 'mainLocation';
        locations.push(location);
      });

      if(secondary) {
        secondary.forEach(function(location) {
          locations.push(location);
        });
      }

      return locations;
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
