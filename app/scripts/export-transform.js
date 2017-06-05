/*
 * Copyright 2017 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* exported exportTransform */
/* jshint camelcase:false */

var exportTransform = (function() {
  return {
    createExportDataForCsv: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [[
        'ad url',
        'dig url',
        'title',
        'date',
        'locations',
        'telephone numbers',
        'email addresses',
        'social media ids',
        'review ids',
        'images',
        'description'
      ]];
      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.textAndCountry;
        }).join('; ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join('; ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join('; ');
        var socialIds = result.socialIds.map(function(socialId) {
          return socialId.text;
        }).join('; ');
        var reviewIds = result.reviewIds.map(function(reviewId) {
          return reviewId.text;
        }).join('; ');
        var images = (result.images || []).map(function(image) {
          return image.source;
        }).join('; ');
        data.push([
          result.url,
          linkPrefix + result.link,
          result.title,
          result.date,
          locations,
          phones,
          emails,
          socialIds,
          reviewIds,
          images,
          result.description.replace(/\n/g, ' ')
        ]);
      });
      return data;
    },

    createExportDataForPdf: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [];
      var nextId = 1;

      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.textAndCountry;
        }).join(', ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join(', ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join(', ');
        var socialIds = result.socialIds.map(function(socialId) {
          return socialId.text;
        }).join(', ');
        var reviewIds = result.reviewIds.map(function(reviewId) {
          return reviewId.text;
        }).join(', ');

        var item = {
          images: (result.images || []).map(function(image) {
            return {
              id: 'image' + nextId++,
              source: encodeURIComponent(image.source.replace('https://s3.amazonaws.com/', '')),
              text: image.source
            };
          }),
          paragraphs: []
        };

        item.paragraphs.push({
          big: true,
          label: result.title,
          value: ''
        });
        item.paragraphs.push({
          label: 'Posting Date:  ',
          value: result.date
        });
        item.paragraphs.push({
          label: 'Locations:  ',
          value: locations
        });
        item.paragraphs.push({
          label: 'Telephone Numbers:  ',
          value: phones
        });
        item.paragraphs.push({
          label: 'Email Addresses:  ',
          value: emails
        });
        item.paragraphs.push({
          label: 'Social Media IDs:  ',
          value: socialIds
        });
        item.paragraphs.push({
          label: 'Review IDs:  ',
          value: reviewIds
        });
        item.paragraphs.push({
          label: 'Description:  ',
          value: result.description.replace(/\n/g, ' ')
        });
        item.paragraphs.push({
          label: 'URL:  ',
          value: result.url
        });
        item.paragraphs.push({
          label: 'DIG URL:  ',
          value: linkPrefix + result.link
        });

        data.push(item);
      });

      return data;
    }
  };
});
