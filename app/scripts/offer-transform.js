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
      confidence: _.isUndefined(confidence) ? 100 : confidence,
      count: count,
      id: getIdOfType(item.key, item.value, type),
      icon: commonTransforms.getIronIcon(extractionType),
      link: commonTransforms.getLink(item.key, extractionType),
      styleClass: commonTransforms.getStyleClass(extractionType),
      text: getTextOfType(item.key, item.value, type),
      type: extractionType,
      provenance: item.provenance
    };
    if(type !== 'cache' && type !== 'date' && type !== 'website') {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var userClassification = item.human_annotation;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      extraction.classifications = {
        //database: '',
        type: commonTransforms.getDatabaseTypeFromUiType(type),
        user: (userClassification === '1' ? 'positive' : (userClassification === '0' ? 'negative' : undefined))
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
    if(type === 'height' || type === 'price' || type === 'review' || type === 'weight') {
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

  function getTitleOrDescriptionHighlightText(record, path) {
    return record.highlight && record.highlight[path] && record.highlight[path].length ? record.highlight[path][0] : undefined;
  }

  function getHighlightPathList(itemId, itemText, result, type, highlightMapping) {
    // The highlightMapping property maps search terms to unique IDs.
    // The result.matched_queries property lists highlights in the format <id>:<path>:<text>

    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var matchedQueries = result.matched_queries;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    var wordsOrPhrases = [];
    if(type === 'location') {
      // Add the city name.
      wordsOrPhrases = [itemId.substring(0, itemId.indexOf(':'))];
    } else if(type === 'phone') {
      // Add the phone without punctuation.
      wordsOrPhrases = [itemText, itemText.replace(/\W/g, '')];
    } else {
      // Add the full text and all single words in the text.  Remove all punctuation so we can separate the words.
      wordsOrPhrases = [itemText].concat(itemText.replace(/\W/g, ' ').split(' '));
    }

    var highlightPaths = {};

    if(matchedQueries && matchedQueries.length && highlightMapping) {
      wordsOrPhrases.forEach(function(wordOrPhrase) {
        // If a highlight mapping exists for the word or phrase, check the matched queries.
        if(highlightMapping[wordOrPhrase]) {
          return matchedQueries.filter(function(path) {
            return _.startsWith(path, highlightMapping[wordOrPhrase]);
          }).map(function(path) {
            // Return the path in the matched queries.
            return path.split(':')[1];
          }).forEach(function(path) {
            highlightPaths[path] = true;
          });
        }
      });
    }

    return _.keys(highlightPaths);
  }

  function checkHighlightedText(text, type) {
    // TODO Do we have to hard-code <em> or can we make it a config variable?
    // Ignore partial matches for emails and websites.
    if((type === 'email' || type === 'website') && (!_.startsWith(text, '<em>') || !_.endsWith(text, '</em>'))) {
      return false;
    }

    var output = text;

    // Usernames are formatted "<website> <username>".  Ignore matches on the <website>.
    if(type === 'username') {
      output = output.indexOf(' ') ? output.substring(output.indexOf(' ') + 1) : output;
    }

    // Return whether the given text has both start and end tags.
    return output.indexOf('<em>') >= 0 && output.indexOf('</em>') >= 0 ? !!(output.replace(/<\/?em\>/g, '')) : false;
  }

  function getHighlightedText(itemId, itemText, result, type, highlightMapping) {
    // Get the paths from the highlight mapping to explore in the result highlights specifically for the given item.
    var pathList = getHighlightPathList(('' + itemId).toLowerCase(), ('' + itemText).toLowerCase(), result, type, highlightMapping);
    var textList = [];
    if(result.highlight && pathList.length) {
      // Find the highlighted text in the result highlights using a highlights path.  Use the first because they are all the same.
      pathList.forEach(function(path) {
        (result.highlight[path] || []).forEach(function(text) {
          if(checkHighlightedText(text)) {
            textList.push(text);
          }
        });
      });
    }
    return textList.length ? textList[0] : undefined;
  }

  function getHighlightedExtractionListFromRecord(data, record, highlightMapping) {
    return data.map(function(item) {
      // The highlight in the extraction object is a boolean (YES or NO).
      item.highlight = !!(getHighlightedText(item.id, item.text, record, item.type, highlightMapping));
      return item;
    });
  }

  function getClassifications(record, path) {
    var classifications = _.get(record, path, {});
    return _.keys(classifications).reduce(function(object, flag) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var userClassification = classifications[flag].human_annotation;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      object[flag] = {
        //database: '',
        type: 'ad',
        user: (userClassification === '1' ? 'positive' : (userClassification === '0' ? 'negative' : undefined))
      };
      return object;
    }, {});
  }

  function getOfferObject(record, highlightMapping) {
    var id = _.get(record, '_source.doc_id');
    var url = _.get(record, '_source.url');

    if(!id || !url) {
      return {};
    }

    var rank = _.get(record, '_score');
    var domain = (_.isArray(_.get(record, '_source.knowledge_graph.website')) && _.get(record, '_source.knowledge_graph.website').length > 0) ? _.get(record, '_source.knowledge_graph.website[0].key') : _.get(record, '_source.knowledge_graph.website.key');
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
      classifications: getClassifications(record, '_source.knowledge_graph._tags'),
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
      dates: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.posting_date', 'date'),
      publishers: getExtractionsFromRecordOfType(record, '_source.knowledge_graph.website', 'website'),
      highlightedText: getTitleOrDescriptionHighlightText(record, 'content_extraction.title.text'),
      details: []
    };

    // TODO Remove this filter when dates with bad months and years are fixed in the data.
    offer.dates = offer.dates.filter(function(dateObject) {
      if(dateObject.text === 'No Date') {
        return false;
      }
      var yearNumber = Number(dateObject.text.substring(dateObject.text.lastIndexOf(' ') + 1));
      return yearNumber > 2010 && yearNumber < 2018 && (new Date().getTime() > new Date(dateObject.id).getTime());
    });

    offer.dateText = offer.dates.length ? offer.dates[0].text : 'Unknown Date';

    // TODO Don't reduce date extractions to a date range when bad dates are fixed in the data.
    if(offer.dates.length > 1) {
      offer.dates = offer.dates.sort(function(a, b) {
        return new Date(a.id) - new Date(b.id);
      });
      offer.dates = [offer.dates[0], offer.dates[offer.dates.length - 1]];
      offer.dateText = 'between ' + offer.dates[0].text + ' and ' + offer.dates[1].text;
      offer.dates[0].text = 'From ' + offer.dates[0].text;
      offer.dates[1].text = 'To ' + offer.dates[1].text;
    }

    // Handle highlighted extractions.
    if(highlightMapping) {
      offer.locations = getHighlightedExtractionListFromRecord(offer.locations, record, highlightMapping.location);
      offer.phones = getHighlightedExtractionListFromRecord(offer.phones, record, highlightMapping.phone);
      offer.emails = getHighlightedExtractionListFromRecord(offer.emails, record, highlightMapping.email);
      offer.socialIds = getHighlightedExtractionListFromRecord(offer.socialIds, record, highlightMapping.social);
      offer.reviewIds = getHighlightedExtractionListFromRecord(offer.reviewIds, record, highlightMapping.review);
      offer.services = getHighlightedExtractionListFromRecord(offer.services, record, highlightMapping.services);
      offer.prices = getHighlightedExtractionListFromRecord(offer.prices, record, highlightMapping.price);
      offer.names = getHighlightedExtractionListFromRecord(offer.names, record, highlightMapping.name);
      offer.genders = getHighlightedExtractionListFromRecord(offer.genders, record, highlightMapping.gender);
      offer.ethnicities = getHighlightedExtractionListFromRecord(offer.ethnicities, record, highlightMapping.ethnicity);
      offer.ages = getHighlightedExtractionListFromRecord(offer.ages, record, highlightMapping.age);
      offer.eyeColors = getHighlightedExtractionListFromRecord(offer.eyeColors, record, highlightMapping.eyeColor);
      offer.hairColors = getHighlightedExtractionListFromRecord(offer.hairColors, record, highlightMapping.hairColor);
      offer.heights = getHighlightedExtractionListFromRecord(offer.heights, record, highlightMapping.height);
      offer.weights = getHighlightedExtractionListFromRecord(offer.weights, record, highlightMapping.weight);
      offer.publishers = getHighlightedExtractionListFromRecord(offer.publishers, record, highlightMapping.website);
    }

    // Handle extraction arrays for single-record elements.
    offer.headerExtractions = [{
      data: offer.publishers,
      name: 'Website'
    }, {
      data: offer.dates,
      name: (offer.dates.length === 1 ? 'Post Date' : 'Possible Post Date Range')
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
      highlightedText: getTitleOrDescriptionHighlightText(record, 'content_extraction.content_strict.text'),
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
