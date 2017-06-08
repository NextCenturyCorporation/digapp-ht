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

var offerTransform = (function(_, serverConfig, commonTransforms) {

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

  function getDateFromRecord(record, path) {
    var data = _.get(record, path, []);
    var item = data ? (_.isArray(data) ? (data.length ? data[0] : {}) : data) : {};
    return {
      confidence: item.confidence,
      key: item.value
    };
  }

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

  function getExtractionType(type) {
    if(type === 'name' || type === 'gender' || type === 'ethnicity' || type === 'age' || type === 'eyeColor' || type === 'hairColor' || type === 'height' || type === 'weight') {
      return 'provider';
    }
    return type;
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
    var extractionType = getExtractionType(type);
    var extraction = {
      annotate: annotateType(type),
      confidence: confidence,
      count: count,
      id: getIdOfType(item.key, item.value, type),
      icon: commonTransforms.getIronIcon(extractionType),
      link: commonTransforms.getLink(item.key, extractionType),
      styleClass: commonTransforms.getStyleClass(extractionType),
      text: getTextOfType(item.key, item.value, type),
      type: extractionType
    };
    if(type !== 'cache' && type !== 'website') {
      extraction.classifications = {
        database: '',
        type: commonTransforms.getDatabaseTypeFromUiType(type),
        user: ''
      };
    }
    if(type === 'location') {
      var locationData = commonTransforms.getLocationDataFromId(extraction.id);
      extraction.latitude = locationData.latitude;
      extraction.longitude = locationData.longitude;
      extraction.text = locationData.text;
      extraction.textAndCount = locationData.text + (extraction.count ? (' (' + extraction.count + ')') : '');
      extraction.textAndCountry = locationData.text + (locationData.country ? (', ' + locationData.country) : '');
    }
    if(type === 'height' || type === 'price' || type === 'weight') {
      var compoundExtractionData = commonTransforms.getExtractionDataFromCompoundId(extraction.id);
      extraction.id = compoundExtractionData.id;
      extraction.text = compoundExtractionData.text;
    }
    return extraction;
  }

  function getFilterFunctionOfType(type) {
    if(type === 'location') {
      // TODO Filter out the bad locations once the extractions are improved.
      //return commonTransforms.isGoodLocation;
    }
    if(type === 'price') {
      return function(item) {
        return item.text !== '-per-min';
      };
    }
    return null;
  }

  function getExtractionsFromListOfType(extractionList, type) {
    var extractionData = extractionList.map(function(item) {
      var confidence = _.isUndefined(item.confidence) ? undefined : (Math.round(Math.min(item.confidence, 1) * 10000.0) / 100.0);
      return getExtractionOfType(item, type, confidence);
    });
    var filterFunction = getFilterFunctionOfType(type);
    return (filterFunction ? extractionData.filter(filterFunction) : extractionData);
  }

  function getExtractionsFromRecordOfType(record, path, type) {
    var data = _.get(record, path, []);
    return getExtractionsFromListOfType(data, type);
  }

  function getHighlightedText(record, paths) {
    var path = _.find(paths, function(path) {
      return record.highlight && record.highlight[path] && record.highlight[path].length && record.highlight[path][0];
    });
    return path ? record.highlight[path][0] : undefined;
  }

  function getHighlightPathList(item, record, highlightMapping) {
    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var pathList = record.matched_queries;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    if(pathList && pathList.length && highlightMapping && highlightMapping[item.id]) {
      return pathList.filter(function(path) {
        return _.startsWith(path, highlightMapping[item.id]);
      }).map(function(path) {
        return path.split(':')[1];
      });
    }

    return [];
  }

  function cleanHighlight(text, type) {
    // Ignore partial matches for emails and websites.
    if((type === 'email' || type === 'website') && (!_.startsWith(text, '<em>') || !_.endsWith(text, '</em>'))) {
      return text.toLowerCase();
    }

    var output = text;

    // Social media usernames are formatted "<website> <username>".
    // Ignore matches on websites in social media usernames.
    if(type === 'social') {
      output = output.indexOf(' ') ? output.substring(output.indexOf(' ') + 1) : output;
    }

    return output.indexOf('<em>') >= 0 ? output.replace(/<\/?em\>/g, '').toLowerCase() : '';
  }

  function addHighlight(item, record, highlightMapping) {
    var pathList = getHighlightPathList(item, record, highlightMapping);
    if(record.highlight && pathList.length) {
      item.highlight = pathList.some(function(path) {
        return (record.highlight[path] || []).some(function(text) {
          var cleanedHighlight = cleanHighlight(text, item.type);
          return cleanedHighlight && (('' + item.id).toLowerCase().indexOf(cleanedHighlight) >= 0);
        });
      });
    }
    return item;
  }

  function addAllHighlights(data, record, highlightMapping) {
    return data.map(function(item) {
      return addHighlight(item, record, highlightMapping);
    });
  }

  function getClassifications(record, path) {
    // TODO
    return {};
  }

  function getOfferObject(record, highlightMapping) {
    var id = _.get(record, '_source.doc_id');
    var url = _.get(record, '_source.url');

    if(!id || !url) {
      return {};
    }

    var rank = _.get(record, '_score');
    var domain = _.get(record, '_source.tld');
    var rawEsDataUrl = (serverConfig && serverConfig.rawEsDataUrl ? (serverConfig.rawEsDataUrl + id) : undefined);

    var offer = {
      id: id,
      url: url,
      rank: rank ? rank.toFixed(2) : rank,
      domain: domain || 'No Domain',
      type: 'offer',
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      classifications: getClassifications(record, ''),
      title: getSingleStringFromRecord(record, '_source.content_extraction.title', 'text') || 'No Title',
      description: getSingleStringFromRecord(record, '_source.content_extraction.content_strict', 'text') || 'No Description',
      locations: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.city', 'location'),
      phones: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.phone', 'phone'),
      emails: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.email', 'email'),
      socialIds: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.social_media_id', 'social'),
      reviewIds: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.review_id', 'review'),
      prices: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.price', 'price'),
      services: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.service', 'service'),
      names: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.name', 'name'),
      genders: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.gender', 'gender'),
      ethnicities: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.ethnicity', 'ethnicity'),
      ages: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.age', 'age'),
      eyeColors: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.eye_color', 'eyeColor'),
      hairColors: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.hair_color', 'hairColor'),
      heights: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.height', 'height'),
      weights: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.weight', 'weight'),
      dates: getExtractionsFromListOfType([getDateFromRecord(record, '_source.knowledge_graph.posting_date')], 'date'),
      publishers: getExtractionsFromListOfType([{
        key: domain
      }], 'website'),
      highlightedText: getHighlightedText(record, ['content_extraction.title.text']),
      details: []
    };

    offer.date = offer.dates.length ? offer.dates[0].text : 'Unknown Date';

    // Handle highlighted extractions.
    if(highlightMapping) {
      offer.locations = addAllHighlights(offer.locations, record, highlightMapping.location);
      offer.phones = addAllHighlights(offer.phones, record, highlightMapping.phone);
      offer.emails = addAllHighlights(offer.emails, record, highlightMapping.email);
      offer.socialIds = addAllHighlights(offer.socialIds, record, highlightMapping.social);
      offer.reviewIds = addAllHighlights(offer.reviewIds, record, highlightMapping.review);
      offer.services = addAllHighlights(offer.services, record, highlightMapping.services);
      offer.prices = addAllHighlights(offer.prices, record, highlightMapping.price);
      offer.names = addAllHighlights(offer.names, record, highlightMapping.name);
      offer.genders = addAllHighlights(offer.genders, record, highlightMapping.gender);
      offer.ethnicities = addAllHighlights(offer.ethnicities, record, highlightMapping.ethnicity);
      offer.ages = addAllHighlights(offer.ages, record, highlightMapping.age);
      offer.eyeColors = addAllHighlights(offer.eyeColors, record, highlightMapping.eyeColor);
      offer.hairColors = addAllHighlights(offer.hairColors, record, highlightMapping.hairColor);
      offer.heights = addAllHighlights(offer.heights, record, highlightMapping.height);
      offer.weights = addAllHighlights(offer.weights, record, highlightMapping.weight);
      offer.publishers = addAllHighlights(offer.publishers, record, highlightMapping.website);
    }

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
    }, {
      data: offer.reviewIds,
      name: 'Review IDs'
    }, {
      data: [],
      name: 'Automated Classifications'
    }];

    offer.detailExtractions = [{
      data: offer.prices,
      name: 'Prices'
    }, {
      data: offer.services,
      name: 'Services Provided'
    }, {
      data: offer.names,
      name: 'Provider Names'
    }, {
      data: offer.ethnicities,
      name: 'Provider Ethnicities'
    }, {
      data: offer.ages,
      name: 'Provider Ages'
    }, {
      data: offer.genders,
      name: 'Provider Genders'
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
    if(rawEsDataUrl) {
      offer.details.push({
        name: 'Raw ES Ad Content',
        link: rawEsDataUrl,
        text: 'Open'
      });
    }
    offer.details.push({
      name: 'Url',
      link: url,
      text: url
    });
    offer.details.push({
      name: 'Description',
      highlightedText: getHighlightedText(record, ['content_extraction.content_strict.text']),
      text: offer.description
    });
    offer.details.push({
      name: 'Cached Ad Webpage',
      link: commonTransforms.getLink(id, 'cache'),
      text: 'Open'
    });

    // Data to show on the offer (ad) entity page.
    offer.cache = {
      link: commonTransforms.getLink(id, 'cache'),
      text: 'Open Cached Ad Webpage'
    };
    offer.raw = !rawEsDataUrl ? undefined : {
      link: rawEsDataUrl,
      text: 'Open Raw ES Ad Content'
    };

    return offer;
  }

  function getTitle(size, type, sayOther) {
    return (size || 'No') + (sayOther ? ' Other ' : ' ') + commonTransforms.getName(type, size !== 1);
  }

  return {
    offer: function(data) {
      if(data && data.hits && data.hits.hits && data.hits.hits.length) {
        return getOfferObject(data.hits.hits[0]);
      }
      return {};
    },

    offers: function(data) {
      if(data && data.hits && data.hits.hits && data.hits.hits.length) {
        return data.hits.hits.map(function(record) {
          return getOfferObject(record);
        });
      }
      return [];
    },

    queryResults: function(data) {
      if(data && data.hits && data.hits.hits && data.hits.hits.length) {
        return data.hits.hits.map(function(record) {
          return getOfferObject(record, data.fields);
        });
      }
      return [];
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

    getExtractionOfType: function(list, type) {
      return getExtractionOfType(list, type);
    },

    getExtractionsFromListOfType: function(list, type) {
      return getExtractionsFromListOfType(list, type);
    },

    /**
     * Returns the formatted telephone number.
     */
    formattedTelephoneNumber: function(number) {
      return commonTransforms.getFormattedPhone(number);
    }
  };
});
