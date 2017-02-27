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
    entities: function(data) {
      var entities = [];

      var addEntity = function(id, name, type) {
        entities.push({
          id: id,
          name: (_.isArray(name) ? (name.length ? name[0] : '') : name),
          type: type
        });
      };

      if(data && data.hits && data.hits.hits && data.hits.hits.length) {
        data.hits.hits.forEach(function(item) {
          if(item._type === 'email') {
            addEntity(item._id, item._source.name, item._type);
          }
          if(item._type === 'image') {
            addEntity(item._id, item._source.url, item._type);
          }
          if(item._type === 'offer') {
            addEntity(item._id, item._source.title, item._type);
          }
          if(item._type === 'phone') {
            addEntity(item._id, item._source.name, item._type);
          }
        });
      }

      return entities;
    }
  };
});

