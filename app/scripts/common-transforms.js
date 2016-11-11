/**
 * Common transform functions used.
 */

/* globals _, moment */
/* exported commonTransforms */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope */
var commonTransforms = (function(_, moment) {

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

  /**
   * Returns the iron icon for the given type.
   */
  function getIronIcon(type) {
    switch(type) {
      case 'cache': return 'icons:cached';
      case 'date': return 'icons:date-range';
      case 'email': return 'communication:email';
      case 'image': return 'image:photo';
      case 'location': return 'communication:location-on';
      case 'money': return 'editor:attach-money';
      case 'offer': return 'maps:local-offer';
      case 'phone': return 'communication:phone';
      case 'provider': return 'icons:account-circle';
      case 'seller': return 'group-work';
      case 'webpage': return 'av:web';
    }
    return 'icons:polymer';
  }

  /**
   * Returns the link for the given ID and type.
   */
  function getLink(id, type) {
    if(!id || !type || !(type === 'cache' || type === 'email' || type === 'image' || type === 'offer' || type === 'phone' || type === 'provider' || type === 'seller')) {
      return undefined;
    }
    return '/' + type + '.html?value=' + id + '&field=_id';
  }

  /**
   * Returns the style class for the given type.
   */
  function getStyleClass(type) {
    if(!type) {
      return '';
    }
    return 'entity-' + type + '-font';
  }

  /**
  * Changes the key/value names of buckets given from an aggregation
  * to names preferred by the user.
  */
  return {
    getClickableObjects: function(records, type) {
      var result = [];
      if(records) {
        (_.isArray(records) ? records : [records]).forEach(function(record) {
          if(record.name) {
            var obj = {
              id: record.uri,
              type: type,
              text: type === 'email' ? decodeURIComponent(record.name) : record.name,
              icon: getIronIcon(type),
              link: type === 'webpage' ? record.name : getLink(record.uri, type),
              styleClass: getStyleClass(type)
            };
            result.push(obj);
          }
        });
      }

      return result;
    },

    /**
     * Returns the string for the given date number/string in UTC format.
     */
    getDate: function(date) {
      if(date) {
        return moment.utc(new Date(date)).format('MMM D, YYYY');
      }
    },

    /**
     * Returns the iron icon for the given type.
     */
    getIronIcon: function(type) {
      return getIronIcon(type);
    },

    /**
     * Returns the link for the given ID and type.
     */
    getLink: function(id, type) {
      return getLink(id, type);
    },

    /**
     * Returns the style class for the given type.
     */
    getStyleClass: function(type) {
      return getStyleClass(type);
    },

    getMentions: function(mentions, type) {
      var output = [];
      (_.isArray(mentions) ? mentions : [mentions]).forEach(function(uri) {
        var text = uri.substring(uri.lastIndexOf('/') + 1);
        if(type === 'phone' && text.indexOf('-') >= 0) {
          // Remove country code.
          text = text.substring(text.indexOf('-') + 1);
        }
        if(type === 'email') {
          text = decodeURIComponent(text);
        }
        output.push({
          id: uri,
          type: type,
          text: text,
          icon: getIronIcon(type),
          link: getLink(uri, type),
          styleClass: getStyleClass(type)
        });
      });
      return output;
    },

    getOfferObject: function(record, mainPath, idPath, datePath, locationPath) {
      return getOfferObject(record, mainPath, idPath, datePath, locationPath);
    }
  };
})(_, moment);
