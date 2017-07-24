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
        'website',
        'locations',
        'telephone numbers',
        'email addresses',
        'prices',
        'names',
        'ages',
        'genders',
        'ethnicities',
        'eye colors',
        'hair colors',
        'heights',
        'weights',
        'social media ids',
        'review ids',
        'description'
      ]];

      results.forEach(function(result) {
        var getExtractionTextList = function(extractions, property) {
          return extractions.map(function(extraction) {
            return extraction[property || 'text'];
          }).join('; ');
        };

        var dates = getExtractionTextList(result.dates);
        var locations = getExtractionTextList(result.locations);
        var phones = getExtractionTextList(result.phones);
        var emails = getExtractionTextList(result.emails);
        var prices = getExtractionTextList(result.prices);
        var names = getExtractionTextList(result.names);
        var ages = getExtractionTextList(result.ages);
        var genders = getExtractionTextList(result.genders);
        var ethnicities = getExtractionTextList(result.ethnicities);
        var eyeColors = getExtractionTextList(result.eyeColors);
        var hairColors = getExtractionTextList(result.hairColors);
        var heights = getExtractionTextList(result.heights);
        var weights = getExtractionTextList(result.weights);
        var socialIds = getExtractionTextList(result.socialIds);
        var reviewIds = getExtractionTextList(result.reviewIds);
        var description = result.description.replace(/\s/g, ' ');

        data.push([
            result.url,
            linkPrefix + result.link,
            result.title,
            dates,
            result.domain,
            locations,
            phones,
            emails,
            prices,
            names,
            ages,
            genders,
            ethnicities,
            eyeColors,
            hairColors,
            heights,
            weights,
            socialIds,
            reviewIds,
            description
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
