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
            icon: commonTransforms.getIronIcon('webpage'),
            styleClass: commonTransforms.getStyleClass('webpage'),
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
              icon: commonTransforms.getIronIcon('phone'),
              link: commonTransforms.getLink(phone.id, 'phone'),
              styleClass: commonTransforms.getStyleClass('phone'),
              text: phone.text,
              type: 'phone',
              id: phone.id
            };
          })
        });
      }
      if(emailAndPhoneLists.emails.length) {
        details.push({
          name: 'Email Address',
          items: _.map(emailAndPhoneLists.emails, function(email) {
            return {
              icon: commonTransforms.getIronIcon('email'),
              link: commonTransforms.getLink(email.id, 'email'),
              styleClass: commonTransforms.getStyleClass('email'),
              text: email.text,
              type: 'email',
              id: email.id
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
   *                 id: "http://email/abc@xyz.com",
   *                 link: "/email.html?value=http://email/abc@xyz.com&field=_id",
   *                 text: "abc@xyz.com",
   *                 type: "email"
   *             }]
   *         }, {
   *             name: "Telephone Number",
   *             items: [{
   *                 id: "http://phone/1234567890",
   *                 link: "/phone.html?value=http://phone/1234567890&field=_id",
   *                 text: "1234567890",
   *                 type: "phone"
   *             }, {
   *                 id: "http://phone/0987654321",
   *                 link: "/phone.html?value=http://phone/0987654321&field=_id",
   *                 text: "0987654321",
   *                 type: "phone"
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
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      if(bucket.doc_count) {
        var dateBucket = {
          date: commonTransforms.getDate(bucket.key),
          icon: commonTransforms.getIronIcon('date'),
          styleClass: commonTransforms.getStyleClass('date')
        };

        var sum = 0;
        var subtitle = [];

        dateBucket.locations = _.map(bucket.locations.buckets, function(locationBucket) {
          sum += locationBucket.doc_count;
          subtitle.push(locationBucket.key.split(':').slice(0, 2).join(', '));
          return {
            name: locationBucket.key.split(':').slice(0, 3).join(', '),
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            type: 'location',
            count: locationBucket.doc_count,
            details: createLocationTimelineDetails(locationBucket)
          };
        });

        if(sum < bucket.doc_count) {
          dateBucket.locations.push({
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            type: 'location',
            count: bucket.doc_count - sum,
            details: []
          });
        }

        dateBucket.subtitle = subtitle.length > 3 ? (subtitle.slice(0, 3).join('; ') + '; and ' + (subtitle.length - 3) + ' more') : subtitle.join('; ');
        timeline.push(dateBucket);
      }
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      return timeline;
    }, []);

    // Sort newest first.
    timeline.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return timeline;
  }

  function getSellerText(phones, emails) {
    var text = '';
    var otherPhonesAndEmails = 0;
    if(phones.length > 0) {
      text = phones[0].text;
      otherPhonesAndEmails += phones.length - 1;
    }
    if(emails.length > 0) {
      text += (text ? ', ' : '') + emails[0].text;
      otherPhonesAndEmails += emails.length - 1;
    }
    if(otherPhonesAndEmails) {
      text += ' (' + otherPhonesAndEmails + ' more)';
    }
    return text || 'Info N/A';
  }

  return {
    // expected data is from an elasticsearch
    seller: function(data) {
      var newData = {};

      if(data && data.hits.hits.length > 0) {
        newData.id = _.get(data.hits.hits[0], '_id');
        newData.type = _.get(data.hits.hits[0], '_type');
        newData.icon = commonTransforms.getIronIcon('seller');
        newData.styleClass = commonTransforms.getStyleClass('seller');
        newData.link = commonTransforms.getLink(newData.id, 'seller');
        newData.telephone = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'telephone'), 'phone');
        newData.emailAddress = commonTransforms.getClickableObjectArr(_.get(data.hits.hits[0]._source, 'email'), 'email');
        newData.text = getSellerText(newData.telephone, newData.emailAddress);
        newData.communications = newData.telephone.concat(newData.emailAddress);
      }

      return newData;
    },

    removeItemFromCommunications: function(communications, text) {
      return (communications || []).filter(function(communication) {
        return communication.text !== text;
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
