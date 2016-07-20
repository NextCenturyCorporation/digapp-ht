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
        source: image.url
      };
    });
  }

  function getOfferSummary(record) {
    /**  build offer summary record:
        {
            "_id": "http://someuri",
            "_type": "offer",
            "title": "*Hello World -- google.com", // title of offer
            "descriptors": [{type: 'date', text: 'July 1, 2016'}], // array of date, phone, email
            "details": {
                "date": "2012-04-23T18:25:43.511Z",
                "address": "Los Angeles", // just use locality
                "publisher": "backpage.com"
            }
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
        text: validFromDate,
        type: 'date'
      });
    }
    var mentions = _.get(record, '_source.mainEntityOfPage.mentions');

    if(mentions) {
      var communications = commonTransforms.getEmailAndPhoneFromMentions(mentions);
      if(communications.phones && communications.phones.length > 0) {
        //get only first phone to show in title
        datePhoneEmail.push({
          id: communications.phones[0]._id,
          text: communications.phones[0].title,
          type: 'phone'
        });
      }
      if(communications.emails && communications.emails.length > 0) {
        //get only first email to show in title
        datePhoneEmail.push({
          id: communications.emails[0]._id,
          text: decodeURIComponent(communications.emails[0].title),
          type: 'email'
        });
      }
    }

    var offerObj = {
      _id: record._id,
      _type: record._type,
      title: _.get(record, '_source.mainEntityOfPage.name', 'Title N/A'),
      descriptors: datePhoneEmail,
      images: getImages(record, 'mainEntityOfPage.hasImagePart'),
      details: {
        description: _.get(record, '_source.mainEntityOfPage.description'),
        address: _.get(record, '_source.availableAtOrFrom.address[0].addressLocality'),
        publisher: _.get(record, '_source.mainEntityOfPage.publisher.name')
      }
    };

    return offerObj;
  }

  function getPhoneSummary(record) {
    /**
        build phone summary object:
        {
            "_id": "http://someuri",
            "_type": "phone",
            "title": "1234567890", // phone number
            "descriptors": []
        }
    */
    var phoneObj = {
      _id: record._id,
      _type: record._type,
      title: _.get(record, '_source.name', 'Phone N/A'),
      descriptors: []
    };
    return phoneObj;
  }

  function getEmailSummary(record) {
    /**
        build email summary object:
        {
            "_id": "http://someuri",
            "_type": "email",
            "title": "abc@xyz.com", // email address
            "descriptors": []
        }
    */
    var emailObj = {
      _id: record._id,
      _type: record._type,
      title: decodeURIComponent(_.get(record, '_source.name', 'Email N/A')),
      descriptors: []
    };
    return emailObj;
  }

  function getSellerSummary(record) {
    /**
        build seller summary object:
        {
            "_id": "http://someuri",
            "_type": "seller",
            "title": "1234567890", // phone number associated with seller
            "descriptors": []
        }
    */

    var sellerObj = {
      _id: record._id,
      _type: record._type,
      descriptors: []
    };

    var phoneField = _.get(record, '_source.telephone');
    if(_.isArray(phoneField)) {
      if(phoneField.length > 0) {
        sellerObj.title = _.get(record, '_source.telephone[0].name', 'Phone N/A');
      }
    } else {
      sellerObj.title = _.get(record, '_source.telephone.name', 'Phone N/A');
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
      webpageObj._type = 'offer';
      webpageObj._id = webpageObj.offer;
    }
  }

  function getWebpageSummary(record) {
    /*  build webpage summary object:
        {
            "_id": "http://someuri",
            "_type": "webpage",
            "title": "*Hello World -- google.com", // title of webpage
            "descriptors": [{type: 'webpage', text: 'something'}], // array of publisher, date, phone, email
            "details": {
                "url": "http://someurlhere.com",
                "body": "description text here",
                "addresses": ["Los Angeles"],
                """if phone exists"""
                "phone": "<phonenumber>",
                """if email exists"""
                "email": "<email>"
                "date": "2012-04-23T18:25:43.511Z"
            }
        }
    */
    var webpageObj = {
      _id: record._id,
      _type: record._type,
      title: _.get(record, '_source.name[0]', 'Title N/A'),
      descriptors: [{
        type: 'webpage',
        text: _.get(record, '_source.publisher.name', 'Publisher N/A')
      }],
      images: getImages(record, 'hasImagePart'),
      offer: _.get(record, '_source.mainEntity.uri'),
      details: {
        url: _.get(record, '_source.url'),
        body: _.get(record, '_source.description'),
        addresses: getAddressArray(record),
        _sortedKeys: ['url', 'body', 'addresses', 'phone', 'email']
      }

    };

    var xDate = _.get(record, '_source.dateCreated');
    if(xDate) {
      webpageObj.descriptors.push({
        type: 'date',
        text: commonTransforms.getDate(xDate)
      });
    }

    var mentions = _.get(record, '_source.mentions');
    if(mentions) {
      var communications = commonTransforms.getEmailAndPhoneFromMentions(mentions);
      if(communications.phones.length > 0) {
        webpageObj.details.phone = communications.phones.map(function(phone) {
          return phone.title;
        }).join(', ');
        webpageObj.descriptors.push({
          id: communications.phones[0]._id,
          text: communications.phones[0].title,
          type: 'phone'
        });
      }
      if(communications.emails.length > 0) {
        webpageObj.details.email = communications.emails.map(function(email) {
          return email.title;
        }).join(', ');
        webpageObj.descriptors.push({
          id: communications.emails[0]._id,
          text: decodeURIComponent(communications.emails[0].title),
          type: 'email'
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
            "_id": "http://someuri",
            "_type": "provider",
            "title": "Emily", // person name
            "descriptors": [{type: 'age', text: 'Age: 20'}], // array of age
            "details": {
                "height": 64,
                "weight": 115,
                "ethnicity": "white"
            }
        }
    */
    var serviceObj = {
      _id: record._id,
      _type: 'provider', // hardcode 'provider' value for now
      title: _.get(record, '_source.name', 'Name N/A'),
      descriptors: [{
        type: 'age',
        text: 'Age: ' + _.get(record, '_source.age', 'N/A')
      }],
      details: {
        height: _.get(record, '_source.height'),
        weight: _.get(record, '_source.weight'),
        ethnicity: _.get(record, '_source.ethnicity'),
      }
    };
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
