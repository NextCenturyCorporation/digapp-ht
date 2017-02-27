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

/* exported entityTransform */
/* jshint camelcase:false */

var entityTransform = (function(_) {
  return {
    entities: function(ids, results) {
      var entities = [];
      var entityIds = [];

      var addEntity = function(id, name, type) {
        entityIds.push(id);
        entities.push({
          id: id,
          name: name,
          type: type
        });
      };

      if(ids && ids.length && results && results.hits && results.hits.hits && results.hits.hits.length) {
        results.hits.hits.forEach(function(item) {
          if(ids.indexOf(item._id) >= 0 && entityIds.indexOf(item._id) < 0) {
            addEntity(item._id, _.get(item, '_source.fields.title.strict[0].name', 'Ad'), 'offer');
          }
          (_.get(item, '_source.fields.email.relaxed', [])).forEach(function(email) {
            if(ids.indexOf(email.key) >= 0 && entityIds.indexOf(email.key) < 0) {
              addEntity(email.key, email.name, 'email');
            }
          });
          (_.get(item, '_source.fields.image.relaxed', [])).forEach(function(image) {
            if(ids.indexOf(image.key) >= 0 && entityIds.indexOf(image.key) < 0) {
              addEntity(image.key, image.name, 'image');
            }
          });
          (_.get(item, '_source.fields.phone.relaxed', [])).forEach(function(phone) {
            if(ids.indexOf(phone.key) >= 0 && entityIds.indexOf(phone.key) < 0) {
              addEntity(phone.key, phone.name, 'phone');
            }
          });
        });
      }

      return entities;
    }
  };
});

