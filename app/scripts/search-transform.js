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

/* exported searchTransform */
/* jshint camelcase:false */

var searchTransform = (function(_) {
  function getSearchPredicateFromUiType(type) {
    switch(type) {
      case 'eyeColor': return 'eye_color';
      case 'hairColor': return 'hair_color';
      case 'image': return '';
      case 'postingDate': return 'posting_date';
      case 'region': return 'state';
      case 'review': return 'review_id';
      case 'services': return 'service';
      case 'social': return 'social_media_id';
      case 'website': return 'tld';
    }
    return type;
  }

  function getUiTypeFromSearchPredicate(type) {
    switch(type) {
      case 'city': return 'location';
      case 'country': return 'location';
      case 'eye_color': return 'eye';
      case 'hair_color': return 'hair';
      case 'posting_date': return 'date';
      case 'review_id': return 'review';
      case 'service': return 'services';
      case 'state': return 'location';
      case 'social_media_id': return 'social';
      case 'tld': return 'website';
    }
    return type;
  }

  return {
    result: function(response) {
      if(response && response.length && response[0].result) {
        var fields = {};
        if(response[0].query && response[0].query.SPARQL && response[0].query.SPARQL.where && response[0].query.SPARQL.where.clauses && response[0].query.SPARQL.where.clauses.length) {
          response[0].query.SPARQL.where.clauses.forEach(function(clause) {
            if(clause.predicate && clause.constraint && clause._id) {
              var type = getUiTypeFromSearchPredicate(clause.predicate);
              fields[type] = fields[type] || {};
              fields[type][clause.constraint] = clause._id;
            }
          });
        }
        return {
          fields: fields,
          hits: response[0].result.hits
        };
      }
      return {
        fields: {},
        hits: {}
      };
    },

    search: function(page, pageSize, searchParameters) {
      var selects = [];
      var clauses = [];
      var filters = [];
      var groupBy;
      var predicates = {};

      if(!_.isEmpty(searchParameters)) {
        _.keys(searchParameters).forEach(function(type) {
          var predicate = getSearchPredicateFromUiType(type);
          _.keys(searchParameters[type]).forEach(function(term) {
            if(searchParameters[type][term].enabled) {
              if(type === 'postingDate') {
                predicates.date = true;

                if(filters.length === 0) {
                  filters.push({});
                }

                if(!filters[0].operator) {
                  filters[0].operator = 'and';
                }

                if(!filters[0].clauses) {
                  filters[0].clauses = [];
                }

                filters[0].clauses.push({
                  constraint: searchParameters[type][term].date,
                  operator: term === 'dateStart' ? '>' : '<',
                  variable: '?date'
                });
              } else if(predicate) {
                predicates[predicate] = true;

                clauses.push({
                  constraint: searchParameters[type][term].key,
                  isOptional: true,
                  predicate: predicate
                });
              }
            }
          });
        });

        _.keys(predicates).forEach(function(predicate) {
          selects.push({
            type: 'simple',
            variable: '?' + predicate
          });
          clauses.push({
            isOptional: (predicate !== 'date'),
            predicate: predicate === 'date' ? 'posting_date' : predicate,
            variable: '?' + predicate
          });
        });

        groupBy = (!page || !pageSize) ? undefined : {
          limit: pageSize,
          offset: (page - 1) * pageSize
        };
      }

      return {
        SPARQL: {
          'group-by': groupBy,
          select: {
            variables: selects
          },
          where: {
            clauses: clauses,
            filters: filters,
            type: 'Ad',
            variable: '?ad'
          }
        },
        type: 'Point Fact'
      };
    }
  };
});

