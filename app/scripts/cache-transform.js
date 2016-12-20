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

/* exported cacheTransform */
/* jshint camelcase:false */

var cacheTransform = (function(_) {
  return {
    ad: function(data) {
      if(data && data.hits.hits.length > 0) {
        return {
          id: _.get(data.hits.hits[0], '_id', ''),
          html: _.get(data.hits.hits[0], '_source.raw_content', '')
        };
      }
      return {
        id: '',
        html: ''
      };
    }
  };
});

