/**
 * transform elastic search seller query to display format.  See data-model.json
 */

/* globals _, relatedEntityTransform, commonTransforms */
/* exported sellerTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope, as should relatedEntityTransform and commonTransforms */
var sellerTransform = (function(_, relatedEntityTransform, commonTransforms) {

  function createLocationTimelineNotes(bucket) {
    var notes = [];

    if(bucket.publishers) {
      notes.push({
        name: 'Websites',
        data: _.map(bucket.publishers.buckets, function(publisher) {
          return {
            icon: commonTransforms.getIronIcon('webpage'),
            styleClass: commonTransforms.getStyleClass('webpage'),
            text: publisher.key,
            type: 'webpage'
          };
        })
      });
    }

    if(bucket.phones) {
      var phones = commonTransforms.getMentions(_.map(bucket.phones.buckets, function(phone) {
        return phone.key;
      }), 'phone');
      if(phones.length) {
        notes.push({
          name: 'Telephone Numbers',
          data: phones
        });
      }
    }

    if(bucket.emails) {
      var emails = commonTransforms.getMentions(_.map(bucket.emails.buckets, function(email) {
        return email.key;
      }), 'email');
      if(emails.length) {
        notes.push({
          name: 'Email Addresses',
          data: emails
        });
      }
    }

    return notes;
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and notes for each location.
   * [{
   *     date: 1455657767,
   *     subtitle: "Mountain View, CA",
   *     locations: [{
   *         name: "Mountain View, CA, USA",
   *         type: "location",
   *         count: 12,
   *         notes: [{
   *             name: "Email Address",
   *             data: [{
   *                 id: "http://email/abc@xyz.com",
   *                 link: "/email.html?value=http://email/abc@xyz.com&field=_id",
   *                 text: "abc@xyz.com",
   *                 type: "email"
   *             }]
   *         }, {
   *             name: "Telephone Number",
   *             data: [{
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
   *             data: [{
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
            notes: createLocationTimelineNotes(locationBucket)
          };
        });

        if(sum < bucket.doc_count) {
          dateBucket.locations.push({
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            type: 'location',
            count: bucket.doc_count - sum,
            notes: []
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

    removeNoteFromLocationTimeline: function(noteItemId, timeline) {
      return timeline.map(function(date) {
        date.locations = date.locations.map(function(location) {
          location.notes = location.notes.map(function(note) {
            var previousLength = note.data.length;
            note.data = note.data.filter(function(item) {
              return item.id !== noteItemId;
            });
            if(note.data.length < previousLength) {
              note.name = 'Other ' + note.name;
            }
            return note;
          });
          // Remove any notes that no longer have any data.
          location.notes = location.notes.filter(function(note) {
            return note.data.length;
          });
          return location;
        });
        return date;
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
