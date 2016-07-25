/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function createLocationTimelineDetails(bucket) {
    var details = [];

    if(bucket.publishers) {
      details.push({
        name: 'Website',
        items: _.map(bucket.publishers.buckets, function(publisher) {
          return {
            text: publisher.key,
            type: 'webpage'
          };
        })
      });
    }

    if(bucket.mentions) {
      var emailAndPhoneLists = commonTransforms.getEmailAndPhoneFromMentions(_.map(bucket.mentions.buckets, function(mention) {
        return mention.key;
      }));
      if(emailAndPhoneLists.phones.length) {
        details.push({
          name: 'Telephone Number',
          items: _.map(emailAndPhoneLists.phones, function(phone) {
            return {
              text: phone.title,
              type: 'phone',
              id: phone._id
            };
          })
        });
      }
      if(emailAndPhoneLists.emails.length) {
        details.push({
          name: 'Email Address',
          items: _.map(emailAndPhoneLists.emails, function(email) {
            return {
              text: email.title,
              type: 'email',
              id: email._id
            };
          })
        });
      }
    }

    return details;
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and details for each location.
   * [{
   *     date: 1455657767,
   *     subtitle: "Mountain View, CA",
   *     locations: [{
   *         name: "Mountain View, CA, USA",
   *         type: "location",
   *         count: 12,
   *         details: [{
   *             name: "Email Address",
   *             items: [{
   *                 text: "abc@xyz.com",
   *                 type: "email",
   *                 id: "http://email/abc@xyz.com"
   *             }]
   *         }, {
   *             name: "Telephone Number",
   *             items: [{
   *                 text: "1234567890",
   *                 type: "phone",
   *                 id: "http://phone/1234567890"
   *             }, {
   *                 text: "0987654321",
   *                 type: "phone",
   *                 id: "http://phone/0987654321"
   *             }]
   *         }, {
   *             name: "Website",
   *             items: [{
   *                 text: "google.com",
   *                 type: "webpage"
   *             }]
   *         }]
   *     }]
   * }]
   */
  function createLocationTimeline(buckets) {
    var timeline = _.reduce(buckets, function(timeline, bucket) {
      var dateBucket = {
        date: commonTransforms.getDate(bucket.key)
      };

      var sum = 0;
      var subtitle = [];

      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      dateBucket.locations = _.map(bucket.locations.buckets, function(locationBucket) {
        sum += locationBucket.doc_count;
        subtitle.push(locationBucket.key.split(':').slice(0, 2).join(', '));
        return {
          name: locationBucket.key.split(':').slice(0, 3).join(', '),
          type: 'location',
          count: locationBucket.doc_count,
          details: createLocationTimelineDetails(locationBucket)
        };
      });

      if(sum < bucket.doc_count) {
        dateBucket.locations.push({
          type: 'location',
          count: bucket.doc_count - sum,
          details: []
        });
      }
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      dateBucket.subtitle = subtitle.length > 3 ? (subtitle.slice(0, 3).join('; ') + '; and ' + (subtitle.length - 3) + ' more') : subtitle.join('; ');
      timeline.push(dateBucket);

      return timeline;
    }, []);

    // Sort newest first.
    timeline.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return timeline;
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

      if(data && data.hits.hits.length > 0) {
        newData._id = _.get(data.hits.hits[0], '_id');
        newData._type = _.get(data.hits.hits[0], '_type');
        newData.telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
        newData.emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
        newData.title = getSellerTitle(newData.telephone, newData.emailAddress);
        newData.descriptors = [];
        newData.communications = newData.telephone.concat(newData.emailAddress);
      }

      return newData;
    },

    removeItemFromCommunications: function(communications, title) {
      return (communications || []).filter(function(communication) {
        return communication.title !== title;
      });
    },

    sellerOffersData: function(data) {
      var newData = {};
      newData.relatedOffers = relatedEntityTransform.offer(data);
      return newData;
    },

    locationTimeline: function(data) {
      return {
        dates: (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets) : undefined
      };
    }
  };
})(_, relatedEntityTransform, commonTransforms);
