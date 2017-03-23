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

  function getDataFromRecord(record, path) {
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

  function getSingleItemFromRecord(record, path) {
    var items = getDataFromRecord(record, path);
    return items.strict.length ? items.strict[0].name : (items.relaxed.length ? items.relaxed[0].name : undefined);
  }

  function getDate(record, path) {
    var date = getSingleItemFromRecord(record, path);
    return commonTransforms.getDate(date) || 'No Date';
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
        link: commonTransforms.getLink(email.key, 'email'),
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

  function getHighRisk(record, path) {
    var risks = getDataFromRecord(record, path);
    return risks.strict.some(function(risk) {
      return risk.name.toLowerCase() === 'yes';
    });
  }

  function getPhonesFromList(list, confidence) {
    return list.map(function(phone) {
      var name = phone.name || phone.key;
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
        text: commonTransforms.getFormattedPhone(name),
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
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var count = price.doc_count;
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          confidence: confidence,
          count: count,
          id: price.key,
          icon: commonTransforms.getIronIcon('money'),
          styleClass: commonTransforms.getStyleClass('money'),
          text: price.name,
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
      var text = attribute.name ? ('' + attribute.name).toLowerCase() : ('' + attribute.key).toLowerCase();
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = attribute.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: attribute.key,
        icon: commonTransforms.getIronIcon('provider'),
        styleClass: commonTransforms.getStyleClass('provider'),
        text: text,
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

  function getReviewIdsFromList(list, confidence) {
    return list.map(function(reviewId) {
      var text = reviewId.name ? ('' + reviewId.name).toLowerCase() : ('' + reviewId.key).toLowerCase();
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = reviewId.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: reviewId.key,
        icon: commonTransforms.getIronIcon('review'),
        styleClass: commonTransforms.getStyleClass('review'),
        text: text,
        type: 'review'
      };
    });
  }

  function getReviewIdsFromRecord(record, path) {
    var reviewIds = getDataFromRecord(record, path);
    return getReviewIdsFromList(reviewIds.strict, 'strict').concat(getReviewIdsFromList(reviewIds.relaxed, 'relaxed'));
  }

  function getServicesFromRecord(record, path) {
    var getServicesFromList = function(list, confidence) {
      return list.map(function(service) {
        var text = service.name ? ('' + service.name).toLowerCase() : ('' + service.key).toLowerCase();
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var count = service.doc_count;
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          confidence: confidence,
          count: count,
          id: service.key,
          icon: commonTransforms.getIronIcon('service'),
          styleClass: commonTransforms.getStyleClass('service'),
          text: text,
          type: 'service'
        };
      });
    };

    var services = getDataFromRecord(record, path);
    return getServicesFromList(services.strict, 'strict').concat(getServicesFromList(services.relaxed, 'relaxed'));
  }

  function getSocialIdsFromList(list, confidence) {
    return list.map(function(socialId) {
      var id = socialId.key.indexOf(' ') ? socialId.key.substring(socialId.key.indexOf(' ') + 1) : socialId.key;
      var text = socialId.name ? ('' + socialId.name).toLowerCase() : ('' + socialId.key).toLowerCase();
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = socialId.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: id,
        icon: commonTransforms.getIronIcon('social'),
        styleClass: commonTransforms.getStyleClass('social'),
        text: text,
        type: 'social'
      };
    });
  }

  function getSocialIdsFromRecord(record, path) {
    var socialIds = getDataFromRecord(record, path);
    return getSocialIdsFromList(socialIds.strict, 'strict').concat(getSocialIdsFromList(socialIds.relaxed, 'relaxed'));
  }

  function getUniqueLocation(location, confidence) {
    // TODO We should use the key (and ignore the name) once the extractions are improved.
    var id = location.key || location.name;
    var data = commonTransforms.getLocationDataFromId(id);

    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    var count = location.doc_count;
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    return {
      confidence: confidence,
      count: count,
      id: id,
      latitude: data.latitude,
      longitude: data.longitude,
      icon: commonTransforms.getIronIcon('location'),
      link: commonTransforms.getLink(location.key, 'location'),
      styleClass: commonTransforms.getStyleClass('location'),
      text: data.text,
      textAndCount: data.text + (count ? (' (' + count + ')') : ''),
      textAndCountry: data.text + (data.country ? (', ' + data.country) : ''),
      type: 'location'
    };
  }

  function getUniqueLocationsFromList(list, confidence) {
    return list.map(function(location) {
      return getUniqueLocation(location, confidence);
      // TODO Filter out the bad locations once the extractions are improved.
      //}).filter(function(location) {
      //return commonTransforms.isGoodLocation(location);
    });
  }

  function getUniqueLocationsFromRecord(record, path) {
    var locations = getDataFromRecord(record, path);
    return getUniqueLocationsFromList(locations.strict, 'strict').concat(getUniqueLocationsFromList(locations.relaxed, 'relaxed'));
  }

  function getHighlightedText(record, path1, path2) {
    if(record.highlight) {
      if(record.highlight[path1] && record.highlight[path1].length && record.highlight[path1][0]) {
        return record.highlight[path1][0];
      }
      if(record.highlight[path2] && record.highlight[path2].length && record.highlight[path2][0]) {
        return record.highlight[path2][0];
      }
    }
    return undefined;
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
        return output.indexOf('<em>') >= 0 ? output.replace(/\<\/?em\>/g, '').toLowerCase() : '';
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
      highRisk: getHighRisk(record, '_source.fields.risk'),
      title: getSingleItemFromRecord(record, '_source.fields.title') || 'No Title',
      description: getSingleItemFromRecord(record, '_source.fields.description') || 'No Description',
      locations: getUniqueLocationsFromRecord(record, '_source.fields.city'),
      phones: getPhonesFromRecord(record, '_source.fields.phone'),
      emails: getEmailsFromRecord(record, '_source.fields.email'),
      socialIds: getSocialIdsFromRecord(record, '_source.fields.social_media_id'),
      reviewIds: getReviewIdsFromRecord(record, '_source.fields.review_id'),
      services: getServicesFromRecord(record, '_source.fields.service'),
      prices: getPricesFromRecord(record, '_source.fields.price'),
      names: getProviderAttributesFromRecord(record, '_source.fields.name'),
      genders: getProviderAttributesFromRecord(record, '_source.fields.gender'),
      ages: getProviderAttributesFromRecord(record, '_source.fields.age'),
      ethnicities: getProviderAttributesFromRecord(record, '_source.fields.ethnicity'),
      eyeColors: getProviderAttributesFromRecord(record, '_source.fields.eye_color'),
      hairColors: getProviderAttributesFromRecord(record, '_source.fields.hair_color'),
      heights: getProviderAttributesFromRecord(record, '_source.fields.height'),
      weights: getProviderAttributesFromRecord(record, '_source.fields.weight'),
      date: {
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        text: getDate(record, '_source.fields.posting_date'),
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
      highlightedText: getHighlightedText(record, 'fields.title.strict.name', 'fields.title.relaxed.name'),
      details: []
    };

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

    offer.details.push({
      name: 'Url',
      link: url || null,
      text: url || 'Unavailable'
    });
    offer.details.push({
      name: 'Description',
      highlightedText: getHighlightedText(record, 'fields.description.strict.name', 'fields.description.relaxed.name'),
      text: offer.description
    });
    offer.details.push({
      name: 'Cached Webpage',
      link: id ? commonTransforms.getLink(id, 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    return offer;
  }

  function getTitle(length, name, sayOther, suffix) {
    return (length || 'No') + (sayOther ? ' Other ' : ' ') + name + (length === 1 ? '' : (suffix || 's'));
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

    offerPhones: function(data, ignoreId) {
      var phones = [];
      var sayOther = false;
      if(data && data.aggregations && data.aggregations.phone && data.aggregations.phone.phone) {
        phones = getPhonesFromList(data.aggregations.phone.phone.buckets || []).filter(function(phone) {
          var result = ignoreId ? phone.id !== ignoreId : true;
          sayOther = sayOther || !result;
          return result;
        });
      }
      return {
        title: getTitle(phones.length, 'Telephone Number', sayOther),
        phone: phones
      };
    },

    offerEmails: function(data, ignoreId) {
      var emails = [];
      var sayOther = false;
      if(data && data.aggregations && data.aggregations.email && data.aggregations.email.email) {
        emails = getEmailsFromList(data.aggregations.email.email.buckets || []).filter(function(email) {
          var result = ignoreId ? email.id !== ignoreId : true;
          sayOther = sayOther || !result;
          return result;
        });
      }
      return {
        title: getTitle(emails.length, 'Email Address', sayOther, 'es'),
        email: emails
      };
    },

    offerLocationsTitle: function(data) {
      return getTitle(data.length, 'Location');
    },

    offerLocations: function(data) {
      var locations = [];
      if(data && data.aggregations && data.aggregations.location && data.aggregations.location.location) {
        locations = getUniqueLocationsFromList(data.aggregations.location.location.buckets || []).filter(function(location) {
          return commonTransforms.isGoodLocation(location);
        });
      }
      return {
        title: getTitle(locations.length, 'Location'),
        location: locations
      };
    },

    offerProviderAttributes: function(data) {
      var attributes = [];
      if(data && data.aggregations && data.aggregations.attribute && data.aggregations.attribute.attribute) {
        attributes = getProviderAttributesFromList(data.aggregations.attribute.attribute.buckets || []);
      }
      return {
        attribute: attributes
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

    offerReviewIds: function(data) {
      var reviewIds = [];
      if(data && data.aggregations && data.aggregations.review && data.aggregations.review.review) {
        reviewIds = getReviewIdsFromList(data.aggregations.review.review.buckets || []);
      }
      return {
        title: getTitle(reviewIds.length, 'Review ID'),
        review: reviewIds
      };
    },

    offerSocialIds: function(data) {
      var socialIds = [];
      if(data && data.aggregations && data.aggregations.social && data.aggregations.social.social) {
        socialIds = getSocialIdsFromList(data.aggregations.social.social.buckets || []);
      }
      return {
        title: getTitle(socialIds.length, 'Social Media ID'),
        social: socialIds
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

    getEmailsFromList: function(list, confidence) {
      return getEmailsFromList(list, confidence);
    },

    getPhonesFromList: function(list, confidence) {
      return getPhonesFromList(list, confidence);
    },

    getPublishersFromList: function(list, confidence) {
      return getPublishersFromList(list, confidence);
    },

    getUniqueLocation: function(location, confidence) {
      return getUniqueLocation(location, confidence);
    },

    /**
     * Returns the formatted telephone number.
     */
    formattedTelephoneNumber: function(number) {
      return commonTransforms.getFormattedPhone(number);
    }
  };
});
