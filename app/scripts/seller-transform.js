/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function createLocationTimelineDetails(bucket, detailName) {
    if(!bucket[detailName]) {
      return [];
    }

    if(detailName === 'mentions') {
      var details = [];
      var emailAndPhoneLists = commonTransforms.getEmailAndPhoneFromMentions(_.map(bucket[detailName].buckets, function(mention) {
        return mention.key;
      }));
      if(emailAndPhoneLists.phones.length) {
        details.push({
          name: 'Phone',
          type: 'phone',
          text: _.map(emailAndPhoneLists.phones, function(phone) {
            return phone.title;
          }).join(', '),
          idList: _.map(emailAndPhoneLists.phones, function(phone) {
            return phone._id;
          })
        });
      }
      if(emailAndPhoneLists.emails.length) {
        details.push({
          name: 'Email',
          type: 'email',
          text: _.map(emailAndPhoneLists.emails, function(email) {
            return email.title;
          }).join(', '),
          idList: _.map(emailAndPhoneLists.emails, function(email) {
            return email._id;
          })
        });
      }
      return details;
    }

    return [{
      name: detailName === 'publisher' ? 'Info' : detailName,
      type: detailName === 'publisher' ? 'webpage' : '',
      text: _.map(bucket[detailName].buckets, function(detailBucket) {
        return detailBucket.key;
      }).join(', '),
      idList: [],
    }];
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and details for each location.
   * [{
   *     date: 1455657767,
   *     locations: [{
   *         name: "Mountain View, CA, USA",
   *         data: [{
   *             name: "Email",
   *             text: "abc@xyz.com",
   *             type: "email",
   *             idList: ["http://email/abc@xyz.com"]
   *         }, {
   *             name: "Phone",
   *             text: "1234567890, 0987654321",
   *             type: "phone",
   *             idList: ["http://phone/1234567890", "http://phone/0987654321"]
   *         }, {
   *             name: "Info",
   *             text: "google.com",
   *             type: "webpage",
   *             idList: []
   *         }]
   *     }]
   * }]
   */
  function createLocationTimeline(buckets, details) {
    var timeline = _.reduce(buckets, function(timeline, bucket) {
      var dateBucket = {
        date: bucket.key
      };

      if(bucket.city.buckets.length) {
        dateBucket.locations = _.map(bucket.city.buckets, function(cityBucket) {
          return {
            name: cityBucket.key.split(':').slice(0, 2).join(', '),
            longName: cityBucket.key.split(':').slice(0, 3).join(', '),
            data: _.reduce(details, function(detailData, detail) {
              return detailData.concat(createLocationTimelineDetails(cityBucket, detail));
            }, [])
          };
        });
        timeline.push(dateBucket);
      }

      return timeline;
    }, []);

    // Sort newest first.
    timeline.sort(function(a, b) {
      return b.date - a.date;
    });

    return timeline;
  }

  function processLocationGraph(records) {
    var data = [];
    _.each(records, function(record) {
      var point = {};
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      point.date = record.key_as_string;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      point.cityCounts = {};

      var sum = 0;
      if(record.localities.buckets) {
        _.each(record.localities.buckets, function(location) {
          var geoData = location.key.split(':');
          var city = geoData[0];
          /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
          point.cityCounts[city] = location.doc_count;
          sum += location.doc_count;
          /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        });
      }
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      point.cityCounts.Other = record.doc_count - sum;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      data.push(point);
    });
    return data;
  }

  function getGeoCities(record) {
    var geos = [];
    _.each(record, function(key) {
      var geoData = key.key.split(':');
      geos.push(geoData[0]);
    });
    geos.push('Other');
    return geos;
  }

  function getSellerTitle(phones, emails) {
    var title = '';
    var otherPhonesAndEmails = 0;
    if(phones.length > 0) {
      title = phones[0].title;
      otherPhonesAndEmails += phones.length - 1;
    }
    if(emails.length > 0) {
      title += (title ? ', ' : '') + emails[0].title;
      otherPhonesAndEmails += emails.length - 1;
    }
    if(otherPhonesAndEmails) {
      title += ' (' + otherPhonesAndEmails + ' more)';
    }
    return title || 'Info N/A';
  }

  return {
    // expected data is from an elasticsearch
    seller: function(data) {
      var newData = {};

      if(data.hits.hits.length > 0) {
        newData._id = _.get(data.hits.hits[0], '_id');
        newData._type = _.get(data.hits.hits[0], '_type');
        newData.telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
        newData.emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
        newData.title = getSellerTitle(newData.telephone, newData.emailAddress);
        newData.descriptors = [];
      }

      return newData;
    },
    phoneEmails: function(data) {
      var newData = [];

      if(data.hits.hits.length > 0) {
        var telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
        var emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');

        if(telephone && emailAddress) {
          newData = telephone.concat(emailAddress);
        } else if(telephone) {
          newData = telephone;
        } else if(emailAddress) {
          newData = emailAddress;
        }
      }

      return newData;
    },
    offerLocationData: function(data) {
      return commonTransforms.offerLocationData(data);
    },
    sellerOffersData: function(data) {
      var newData = {};
      newData.relatedOffers = relatedEntityTransform.offer(data);
      return newData;
    },
    people: function(data) {
      var newData = {};

      if(data.aggregations) {
        newData = commonTransforms.getPeople(data.aggregations);
      }

      return newData;
    },
    itinerary: function(data) {
      return {
        dates: data.aggregations ? createLocationTimeline(data.aggregations.phone.timeline.buckets, ['publisher','mentions']) : undefined
      };
    },
    locationTimeline: function(data) {
      var newData = {};

      if(data.aggregations) {
        var aggs = data.aggregations;
        newData.locations = getGeoCities(aggs.offersPhone.locations.buckets);
        newData.data = processLocationGraph(aggs.offersPhone.offerTimeline.buckets);
      }
      return newData;
    }
  };
})(_, relatedEntityTransform, commonTransforms);
