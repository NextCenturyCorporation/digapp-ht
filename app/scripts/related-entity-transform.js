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
    var addressesFromData = _.get(record, '_source.' + path, []);

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
    var images = _.get(record, '_source.' + path, []);
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

  function getOfferSummary(record) {
    /**  build offer summary record:
        {
            "id": "http://someuri",
            "type": "offer",
            "text": "*Hello World -- google.com", // title of offer
            "link": "/offer.html?value=http://someuri&field=_id",
            "descriptors": [{type: 'date', text: 'July 1, 2016'}], // array of date, phone, email
            "details": [{
                "name": "description",
                "text": "This is the description."
            }, {
                "name": "address",
                "text": "Los Angeles"
            }, {
                "name": "publisher",
                "text": "google.com."
            }]
        }
    */

    var offerObj = {
      id: record._id,
      url: _.get(record, '_source.mainEntityOfPage.url', 'Unavailable'),
      date: commonTransforms.getDate(_.get(record, '_source.validFrom')) || 'No Date',
      publisher: _.get(record, '_source.mainEntityOfPage.publisher.name', 'No Publisher'),
      description: _.get(record, '_source.mainEntityOfPage.description', ''),
      type: 'offer',
      text: _.get(record, '_source.mainEntityOfPage.name', 'No Title'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(record._id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      images: getImages(record, 'mainEntityOfPage.hasImagePart'),
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
      link: _.get(record, '_source.mainEntityOfPage.url', null),
      text: offerObj.url
    });
    offerObj.details.push({
      name: 'Description',
      text: offerObj.description
    });
    offerObj.details.push({
      name: 'Cached Ad',
      link: record._id ? commonTransforms.getLink(record._id.substring(record._id.lastIndexOf('/') + 1), 'cache') : null,
      text: record._id ? 'Open' : 'Unavailable'
    });

    var locations = getAddresses(record, 'availableAtOrFrom.address');
    offerObj.descriptors = offerObj.descriptors.concat(locations);
    offerObj.locations = locations.map(function(location) {
      return location.text;
    }).join('; ');

    var phones = commonTransforms.getMentions(_.get(record, '_source.mainEntityOfPage.mentionsPhone', []), 'phone');
    offerObj.descriptors = offerObj.descriptors.concat(phones);
    offerObj.phones = phones.map(function(phone) {
      return phone.text;
    }).join('; ');

    var emails = commonTransforms.getMentions(_.get(record, '_source.mainEntityOfPage.mentionsEmail', []), 'email');
    offerObj.descriptors = offerObj.descriptors.concat(emails);
    offerObj.emails = emails.map(function(email) {
      return email.text;
    }).join('; ');

    return offerObj;
  }

  function getPhoneSummary(record) {
    /**
        build phone summary object:
        {
            "id": "http://someuri",
            "type": "phone",
            "text": "1234567890", // phone number
            "link": "/phone.html?value=http://someuri&field=_id",
            "descriptors": []
        }
    */
    var phoneObj = {
      id: record._id,
      type: record._type,
      text: _.get(record, '_source.name', 'Phone N/A'),
      icon: commonTransforms.getIronIcon('phone'),
      link: commonTransforms.getLink(record._id, 'phone'),
      styleClass: commonTransforms.getStyleClass('phone'),
      descriptors: []
    };
    return phoneObj;
  }

  function getEmailSummary(record) {
    /**
        build email summary object:
        {
            "id": "http://someuri",
            "type": "email",
            "text": "abc@xyz.com", // email address
            "link": "/email.html?value=http://someuri&field=_id",
            "descriptors": []
        }
    */
    var emailObj = {
      id: record._id,
      type: record._type,
      text: decodeURIComponent(_.get(record, '_source.name', 'Email N/A')),
      icon: commonTransforms.getIronIcon('email'),
      link: commonTransforms.getLink(record._id, 'email'),
      styleClass: commonTransforms.getStyleClass('email'),
      descriptors: []
    };
    return emailObj;
  }

  function getSellerSummary(record) {
    /**
        build seller summary object:
        {
            "id": "http://someuri",
            "type": "seller",
            "text": "1234567890", // phone number associated with seller
            "link": "/seller.html?value=http://someuri&field=_id",
            "descriptors": []
        }
    */

    var sellerObj = {
      id: record._id,
      type: record._type,
      icon: commonTransforms.getIronIcon('seller'),
      link: commonTransforms.getLink(record._id, 'seller'),
      styleClass: commonTransforms.getStyleClass('seller'),
      descriptors: []
    };

    var phoneField = _.get(record, '_source.telephone');
    if(_.isArray(phoneField)) {
      if(phoneField.length > 0) {
        sellerObj.text = _.get(record, '_source.telephone[0].name', 'Phone N/A');
      }
    } else {
      sellerObj.text = _.get(record, '_source.telephone.name', 'Phone N/A');
    }

    return sellerObj;
  }

  function getWebpageSummary(record) {
    /*  build webpage summary object:
        {
            "id": "http://someuri",
            "type": "webpage",
            "text": "*Hello World -- google.com", // title of webpage
            "link": "/offer.html?value=http://someuri&field=_id",
            "descriptors": [{type: 'webpage', text: 'something'}], // array of publisher, date, phone, email
            "details": [{
                "name": "url",
                "text": "http://someurlhere.com",
                "link": true
            }, {
                "name": "body",
                "text": "description text here"
            }, {
                "name": "addresses",
                "text": ["Los Angeles"]
            }]
        }
    */

    var id = _.get(record, '_source.mainEntity.uri');

    var webpageObj = {
      id: id,
      url: _.get(record, '_source.url', 'Unavailable'),
      date: commonTransforms.getDate(_.get(record, '_source.dateCreated')) || 'No Date',
      publisher: _.get(record, '_source.publisher.name', 'No Publisher'),
      description: _.get(record, '_source.description', ''),
      type: 'offer',
      text: _.get(record, '_source.name[0]', 'No Title'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      images: getImages(record, 'hasImagePart'),
      descriptors: [],
      details: []
    };

    webpageObj.text = _.isArray(webpageObj.text) ? webpageObj.text.join('; ') : webpageObj.text;
    webpageObj.highlightedText = _.get(record, 'highlight.name[0]');

    webpageObj.descriptors.push({
      icon: commonTransforms.getIronIcon('date'),
      styleClass: commonTransforms.getStyleClass('date'),
      type: 'date',
      text: webpageObj.date
    });
    webpageObj.descriptors.push({
      icon: commonTransforms.getIronIcon('webpage'),
      styleClass: commonTransforms.getStyleClass('webpage'),
      type: 'webpage',
      text: webpageObj.publisher
    });
    webpageObj.details.push({
      name: 'Url',
      link: _.get(record, '_source.url', null),
      text: webpageObj.url
    });
    webpageObj.details.push({
      name: 'Description',
      highlightedText: _.get(record, 'highlight.description[0]'),
      text: webpageObj.description
    });
    webpageObj.details.push({
      name: 'Cached Ad',
      link: id ? commonTransforms.getLink(id.substring(id.lastIndexOf('/') + 1), 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    var locations = getAddresses(record, 'mainEntity.availableAtOrFrom.address');
    webpageObj.descriptors = webpageObj.descriptors.concat(locations);
    webpageObj.locations = locations.map(function(location) {
      return location.text;
    }).join('; ');

    var phones = commonTransforms.getMentions(_.get(record, '_source.mentionsPhone', []), 'phone');
    webpageObj.descriptors = webpageObj.descriptors.concat(phones);
    webpageObj.phones = phones.map(function(phone) {
      return phone.text;
    }).join('; ');

    var emails = commonTransforms.getMentions(_.get(record, '_source.mentionsEmail', []), 'email');
    webpageObj.descriptors = webpageObj.descriptors.concat(emails);
    webpageObj.emails = emails.map(function(email) {
      return email.text;
    }).join('; ');

    return webpageObj;
  }

  function getServiceSummary(record) {
    /*
        build service/provider summary object:
        {
            "id": "http://someuri",
            "type": "provider",
            "text": "Emily", // person name
            "link": "/provider.html?value=http://someuri&field=_id",
            "descriptors": [{type: 'age', text: 'Age: 20'}], // array of age
            "details": [{
                "name": "height",
                "text": 64
            }, {
                "name": "weight",
                "text": 115
            }, {
                "name": "ethnicity",
                "text": "white"
            }]
        }
    */
    var serviceObj = {
      id: record._id,
      type: 'provider', // hardcode 'provider' value for now
      text: _.get(record, '_source.name', 'Name N/A'),
      icon: commonTransforms.getIronIcon('provider'),
      link: commonTransforms.getLink(record._id, 'provider'),
      styleClass: commonTransforms.getStyleClass('provider'),
      descriptors: [{
        type: 'age',
        text: 'Age: ' + _.get(record, '_source.age', 'N/A')
      }],
      details: []
    };

    var height = _.get(record, '_source.height');
    if(height) {
      serviceObj.details.push({
        name: 'height',
        text: _.isArray(height) ? height.join(', ') : height
      });
    }
    var weight = _.get(record, '_source.weight');
    if(weight) {
      serviceObj.details.push({
        name: 'weight',
        text: _.isArray(weight) ? weight.join(', ') : weight
      });
    }
    var ethnicity = _.get(record, '_source.ethnicity');
    if(ethnicity) {
      serviceObj.details.push({
        name: 'ethnicity',
        text: _.isArray(ethnicity) ? ethnicity.join(', ') : ethnicity
      });
    }

    return serviceObj;
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
    phone: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getPhoneSummary(record));
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },
    email: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getEmailSummary(record));
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },
    seller: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getSellerSummary(record));
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    },
    service: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          newObj.data.push(getServiceSummary(record));
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
    },
    // transform for combined sets of results not separated by type
    combinedResults: function(data) {
      var newObj = {data: [], count: 0};
      if(data && data.hits.hits.length > 0) {
        _.each(data.hits.hits, function(record) {
          switch(record._type) {
            case 'email': newObj.data.push(getEmailSummary(record)); break;
            case 'adultservice': newObj.data.push(getServiceSummary(record)); break;
            case 'phone': newObj.data.push(getPhoneSummary(record)); break;
            case 'offer': newObj.data.push(getOfferSummary(record)); break;
            case 'seller': newObj.data.push(getSellerSummary(record)); break;
            case 'webpage': newObj.data.push(getWebpageSummary(record)); break;
          }
        });
        newObj.count = data.hits.total;
      }
      return newObj;
    }
  };
})(_, commonTransforms);
