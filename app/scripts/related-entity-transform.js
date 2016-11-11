/**
 * transform elastic search related entity query to display format.  See data-model.json
 */

/* globals _, commonTransforms */
/* exported relatedEntityTransform */
var relatedEntityTransform = (function(_, commonTransforms) {

  /**
   * Returns the list of addresses as strings from the given record using the given path from its _source.
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
      type: 'offer',
      text: _.get(record, '_source.mainEntityOfPage.name', 'No Title'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(record._id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      images: getImages(record, 'mainEntityOfPage.hasImagePart'),
      descriptors: [{
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        type: 'date',
        text: commonTransforms.getDate(_.get(record, '_source.validFrom')) || 'No Date'
      }, {
        icon: commonTransforms.getIronIcon('webpage'),
        styleClass: commonTransforms.getStyleClass('webpage'),
        type: 'webpage',
        text: _.get(record, '_source.mainEntityOfPage.publisher.name', 'No Publisher')
      }],
      details: [{
        name: 'Url',
        link: _.get(record, '_source.mainEntityOfPage.url', null),
        text: _.get(record, '_source.mainEntityOfPage.url', 'Unavailable')
      }, {
        name: 'Description',
        text: _.get(record, '_source.mainEntityOfPage.description', 'Unavailable')
      }, {
        name: 'Cached Ad',
        link: record._id ? commonTransforms.getLink(record._id.substring(record._id.lastIndexOf('/') + 1), 'cache') : null,
        text: record._id ? 'Open' : 'Unavailable'
      }]
    };

    offerObj.text = _.isArray(offerObj.text) ? offerObj.text.join(', ') : offerObj.text;

    offerObj.descriptors = offerObj.descriptors.concat(getAddresses(record, 'availableAtOrFrom.address'));
    offerObj.descriptors = offerObj.descriptors.concat(commonTransforms.getMentions(_.get(record, '_source.mainEntityOfPage.mentionsPhone', []), 'phone'));
    offerObj.descriptors = offerObj.descriptors.concat(commonTransforms.getMentions(_.get(record, '_source.mainEntityOfPage.mentionsEmail', []), 'email'));

    return offerObj;
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
      type: 'offer',
      text: _.get(record, '_source.name[0]', 'No Title'),
      icon: commonTransforms.getIronIcon('offer'),
      link: commonTransforms.getLink(id, 'offer'),
      styleClass: commonTransforms.getStyleClass('offer'),
      images: getImages(record, 'hasImagePart'),
      descriptors: [{
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        type: 'date',
        text: commonTransforms.getDate(_.get(record, '_source.dateCreated')) || 'No Date'
      }, {
        icon: commonTransforms.getIronIcon('webpage'),
        styleClass: commonTransforms.getStyleClass('webpage'),
        type: 'webpage',
        text: _.get(record, '_source.publisher.name', 'No Publisher')
      }],
      details: [{
        name: 'Url',
        link: _.get(record, '_source.url', null),
        text: _.get(record, '_source.url', 'Unavailable')
      }, {
        name: 'Description',
        highlightedText: _.get(record, 'highlight.description[0]'),
        text: _.get(record, '_source.description', 'Unavailable')
      }, {
        name: 'Cached Ad',
        link: id ? commonTransforms.getLink(id.substring(id.lastIndexOf('/') + 1), 'cache') : null,
        text: id ? 'Open' : 'Unavailable'
      }]
    };

    webpageObj.text = _.isArray(webpageObj.text) ? webpageObj.text.join(', ') : webpageObj.text;
    webpageObj.highlightedText = _.get(record, 'highlight.name[0]');

    webpageObj.descriptors = webpageObj.descriptors.concat(getAddresses(record, 'mainEntity.availableAtOrFrom.address'));
    webpageObj.descriptors = webpageObj.descriptors.concat(commonTransforms.getMentions(_.get(record, '_source.mentionsPhone', []), 'phone'));
    webpageObj.descriptors = webpageObj.descriptors.concat(commonTransforms.getMentions(_.get(record, '_source.mentionsEmail', []), 'email'));

    return webpageObj;
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
