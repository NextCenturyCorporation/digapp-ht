/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function(_, commonTransforms) {

  /**
   * Returns the list of addresses as objects from the given record using the given path from its _source.
   */
  function getAddresses(record, path) {
    var addresses = [];
    var addressesFromData = _.get(record, path, []);

    (_.isArray(addressesFromData) ? addressesFromData : [addressesFromData]).forEach(function(addressFromData) {
      var locality = _.get(addressFromData, 'addressLocality');
      var region = _.get(addressFromData, 'addressRegion');
      var country = _.get(addressFromData, 'addressCountry');

      if(locality) {
        addresses.push({
          icon: commonTransforms.getIronIcon('location'),
          styleClass: commonTransforms.getStyleClass('location'),
          text: locality + (region ? (', ' + region) : '') + (country ? (', ' + country) : ''),
          type: 'location'
        });
      }
    });

    return addresses;
  }

  /**
   * Returns the list of image objects from the given record using the given path from its _source.
   */
  function getImages(record, path) {
    var images = _.get(record, path, []);
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

  function getOfferObject(record, mainPath, idPath, datePath, locationPath) {
    var id = _.get(record, idPath);

    var offerObj = {
      id: id,
      url: _.get(record, mainPath + '.url', 'Unavailable'),
      date: commonTransforms.getDate(_.get(record, datePath)) || 'No Date',
      publisher: _.get(record, mainPath + '.publisher.name', 'No Publisher'),
      description: _.get(record, mainPath + '.description', 'No Description'),
      type: 'offer',
      text: _.get(record, mainPath + '.name', 'No Title'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      images: getImages(record, mainPath + '.hasImagePart'),
      descriptors: [],
      details: []
    };

    offerObj.text = _.isArray(offerObj.text) ? offerObj.text.join(', ') : offerObj.text;

    offerObj.descriptors.push({
      icon: commonTransforms.getIronIcon('date'),
      styleClass: commonTransforms.getStyleClass('date'),
      type: 'date',
      text: offerObj.date
    });
    offerObj.descriptors.push({
      icon: commonTransforms.getIronIcon('webpage'),
      styleClass: commonTransforms.getStyleClass('webpage'),
      type: 'webpage',
      text: offerObj.publisher
    });

    offerObj.details.push({
      name: 'Url',
      link: _.get(record, mainPath + '.url', null),
      text: offerObj.url
    });
    offerObj.details.push({
      name: 'Description',
      text: offerObj.description
    });
    offerObj.details.push({
      name: 'Cached Ad',
      link: id ? commonTransforms.getLink(id.substring(id.lastIndexOf('/') + 1), 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    var locations = getAddresses(record, locationPath + '.availableAtOrFrom.address');
    offerObj.descriptors = offerObj.descriptors.concat(locations);
    offerObj.locations = locations.map(function(location) {
      return location.text;
    }).join('; ');

    var phones = commonTransforms.getMentions(_.get(record, mainPath + '.mentionsPhone', []), 'phone');
    offerObj.descriptors = offerObj.descriptors.concat(phones);
    offerObj.phones = phones.map(function(phone) {
      return phone.text;
    }).join('; ');

    var emails = commonTransforms.getMentions(_.get(record, mainPath + '.mentionsEmail', []), 'email');
    offerObj.descriptors = offerObj.descriptors.concat(emails);
    offerObj.emails = emails.map(function(email) {
      return email.text;
    }).join('; ');

    return offerObj;
  }

  function getOfferSummary(record) {
    return getOfferObject(record, '_source.mainEntityOfPage', '_id', '_source.validFrom', '_source');
  }

  function getWebpageSummary(record) {
    var object = getOfferObject(record, '_source', '_source.mainEntity.uri', '_source.dateCreated', '_source.mainEntity');
    object.highlightedText = _.get(record, 'highlight.name[0]');
    object.details[1].highlightedText = _.get(record, 'highlight.description[0]');
    return object;
  }

  return {
    // expected data is from an elasticsearch query
    offer: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getOfferSummary(record));
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },
    webpage: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          var webpageSummary = getWebpageSummary(record);
          newObj.data.push(webpageSummary);
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    }
  };
})(_, commonTransforms);
