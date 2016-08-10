/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function(_, commonTransforms) {

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
        source: image.url,
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
                "label": "description",
                "value": "This is the description."
            }, {
                "label": "address",
                "value": "Los Angeles"
            }, {
                "label": "publisher",
                "value": "google.com."
            }]
        }
    */
    var validFromDateString = _.get(record, '_source.validFrom');
    var validFromDate;
    if(validFromDateString) {
      validFromDate = commonTransforms.getDate(validFromDateString);
    }
    var datePhoneEmail = [];
    if(validFromDate) {
      datePhoneEmail.push({
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        text: validFromDate,
        type: 'date'
      });
    }
    var mentions = _.get(record, '_source.mainEntityOfPage.mentions');

    if(mentions) {
      var communications = commonTransforms.getEmailAndPhoneFromMentions(mentions);
      if(communications.phones && communications.phones.length) {
        communications.phones.forEach(function(phone) {
          datePhoneEmail.push({
            id: phone.id,
            icon: commonTransforms.getIronIcon('phone'),
            link: phone.link,
            styleClass: commonTransforms.getStyleClass('phone'),
            text: phone.text,
            type: 'phone'
          });
        });
      }
      if(communications.emails && communications.emails.length) {
        communications.emails.forEach(function(email) {
          datePhoneEmail.push({
            id: email.id,
            icon: commonTransforms.getIronIcon('email'),
            link: email.link,
            styleClass: commonTransforms.getStyleClass('email'),
            text: decodeURIComponent(email.text),
            type: 'email'
          });
        });
      }
    }

    var offerObj = {
      id: record._id,
      type: record._type,
      text: _.get(record, '_source.mainEntityOfPage.name', 'Title N/A'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(record._id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      descriptors: datePhoneEmail,
      images: getImages(record, 'mainEntityOfPage.hasImagePart'),
      details: []
    };

    var description = _.get(record, '_source.mainEntityOfPage.description');
    if(description) {
      offerObj.details.push({
        label: 'description',
        value: _.get(record, '_source.mainEntityOfPage.description')
      });
    }
    var address = _.get(record, '_source.availableAtOrFrom.address[0].addressLocality');
    if(address) {
      offerObj.details.push({
        label: 'address',
        value: _.get(record, '_source.availableAtOrFrom.address[0].addressLocality')
      });
    }
    var publisher = _.get(record, '_source.mainEntityOfPage.publisher.name');
    if(publisher) {
      offerObj.details.push({
        label: 'publisher',
        value: _.get(record, '_source.mainEntityOfPage.publisher.name')
      });
    }

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

  function getAddressArray(record) {
    /** build address array:
        "addresses": ["Los Angeles"]
    */
    var addresses = [];
    var addressesArr = _.get(record, '_source.mainEntity.availableAtOrFrom.address', []);

    (_.isArray(addressesArr) ? addressesArr : [addressesArr]).forEach(function(addressElem) {
      var locality = _.get(addressElem, 'addressLocality');
      var region = _.get(addressElem, 'addressRegion');
      var country = _.get(addressElem, 'addressCountry');

      if(locality) {
        var address = locality + ', ' + region + ', ' + country;
        addresses.push(address);
      }
    });
    return addresses;
  }

  function redirectWebpageToOffer(webpageObj) {
    //We do not want to show webpage page, but instead direct
    //to offer. The below handles that.
    if(webpageObj.offer) {
      webpageObj.type = 'offer';
      webpageObj.id = webpageObj.offer;
    }
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
                "label": "url",
                "value": "http://someurlhere.com",
                "url": true
            }, {
                "label": "body",
                "value": "description text here"
            }, {
                "label": "addresses",
                "value": ["Los Angeles"]
            }]
        }
    */
    var webpageObj = {
      id: record._id,
      type: record._type,
      text: _.get(record, '_source.name[0]', 'Title N/A'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(record._id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      descriptors: [{
        icon: commonTransforms.getIronIcon('webpage'),
        styleClass: commonTransforms.getStyleClass('webpage'),
        type: 'webpage',
        text: _.get(record, '_source.publisher.name', 'Publisher N/A')
      }],
      images: getImages(record, 'hasImagePart'),
      offer: _.get(record, '_source.mainEntity.uri'),
      details: []
    };

    var url = _.get(record, '_source.url');
    if(url) {
      webpageObj.details.push({
        label: 'url',
        value: url,
        url: true
      });
    }
    var body = _.get(record, '_source.description');
    if(body) {
      webpageObj.details.push({
        label: 'body',
        value: body
      });
    }
    var addresses = getAddressArray(record);
    if(addresses && addresses.length) {
      webpageObj.details.push({
        label: 'addresses',
        value: addresses
      });
    }

    var xDate = _.get(record, '_source.dateCreated');
    if(xDate) {
      webpageObj.descriptors.push({
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        type: 'date',
        text: commonTransforms.getDate(xDate)
      });
    }

    var mentions = _.get(record, '_source.mentions');
    if(mentions) {
      var communications = commonTransforms.getEmailAndPhoneFromMentions(mentions);
      if(communications.phones.length) {
        webpageObj.details.push({
          label: 'telephone numbers',
          value: communications.phones.map(function(phone) {
            return phone.text;
          }).join(', ')
        });
        communications.phones.forEach(function(phone) {
          webpageObj.descriptors.push({
            id: phone.id,
            icon: commonTransforms.getIronIcon('phone'),
            link: phone.link,
            styleClass: commonTransforms.getStyleClass('phone'),
            text: phone.text,
            type: 'phone'
          });
        });
      }
      if(communications.emails.length) {
        webpageObj.details.push({
          label: 'email addresses',
          value: communications.emails.map(function(email) {
            return email.text;
          }).join(', ')
        });
        communications.emails.forEach(function(email) {
          webpageObj.descriptors.push({
            id: email.id,
            icon: commonTransforms.getIronIcon('email'),
            link: email.link,
            styleClass: commonTransforms.getStyleClass('email'),
            text: decodeURIComponent(email.text),
            type: 'email'
          });
        });
      }
    }

    redirectWebpageToOffer(webpageObj);

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
                "label": "height",
                "value": 64
            }, {
                "label": "weight",
                "value": 115
            }, {
                "label": "ethnicity",
                "value": "white"
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
        label: 'height',
        value: height
      });
    }
    var weight = _.get(record, '_source.weight');
    if(weight) {
      serviceObj.details.push({
        label: 'weight',
        value: weight
      });
    }
    var ethnicity = _.get(record, '_source.ethnicity');
    if(ethnicity) {
      serviceObj.details.push({
        label: 'ethnicity',
        value: ethnicity
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
