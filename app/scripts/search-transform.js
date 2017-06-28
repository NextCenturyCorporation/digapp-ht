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

var searchTransform = (function(_, commonTransforms) {
  function getAggregationDataFromResponse(response, property) {
    if(response && response.length && response[0].result && response[0].result.aggregations && response[0].result.aggregations['?' + property]) {
      return response[0].result.aggregations['?' + property].buckets || [];
    }
    return [];
  }

  function getTemplateFromSearchParameters(searchParameters, optional) {
    var predicates = {};
    var template = {
      clauses: [],
      filters: [],
      selects: []
    };

    if(!_.isEmpty(searchParameters)) {
      _.keys(searchParameters).forEach(function(type) {
        var predicate = commonTransforms.getDatabaseTypeFromUiType(type);
        _.keys(searchParameters[type]).forEach(function(term) {
          if(searchParameters[type][term].enabled) {
            if(type === 'postingDate') {
              // Use a single date variable ('date1').
              predicates.date = 1;

              if(template.filters.length === 0) {
                template.filters.push({});
              }

              if(!template.filters[0].operator) {
                template.filters[0].operator = 'and';
              }

              if(!template.filters[0].clauses) {
                template.filters[0].clauses = [];
              }

              template.filters[0].clauses.push({
                constraint: searchParameters[type][term].date,
                operator: term === 'dateStart' ? '>' : '<',
                variable: '?date1'
              });
            } else if(predicate) {
              predicates[predicate] = (predicates[predicate] || 0) + 1;

              template.clauses.push({
                constraint: searchParameters[type][term].key,
                isOptional: optional,
                predicate: predicate
              });
            }
          }
        });
      });

      _.keys(predicates).forEach(function(predicate) {
        for(var i = 1; i <= predicates[predicate]; ++i) {
          template.selects.push({
            type: 'simple',
            variable: '?' + predicate + i
          });
          template.clauses.push({
            isOptional: (predicate === 'date' ? false : optional),
            predicate: predicate === 'date' ? 'posting_date' : predicate,
            variable: '?' + predicate + i
          });
        }
      });
    }

    return template;
  }

  return {
    adQuery: function(searchParameters, config) {
      var template = getTemplateFromSearchParameters(searchParameters, true);
      var groupBy = (!config || !config.page || !config.pageSize) ? undefined : {
        limit: config.pageSize,
        offset: (config.page - 1) * config.pageSize
      };

      return {
        SPARQL: {
          'group-by': groupBy,
          select: {
            variables: template.selects
          },
          where: {
            clauses: template.clauses,
            filters: template.filters,
            type: 'Ad',
            variable: '?ad'
          }
        },
        type: 'Point Fact'
      };
    },

    adResults: function(response) {
      if(response && response.length && response[0].result) {
        var fields = {};
        if(response[0].query && response[0].query.SPARQL && response[0].query.SPARQL.where && response[0].query.SPARQL.where.clauses && response[0].query.SPARQL.where.clauses.length) {
          response[0].query.SPARQL.where.clauses.forEach(function(clause) {
            if(clause.predicate && clause.constraint && clause._id) {
              var type = commonTransforms.getUiTypeFromDatabaseType(clause.predicate);
              fields[type] = fields[type] || {};
              fields[type][clause.constraint] = clause._id;
            }
          });
        }
        return {
          fields: fields,
          hits: response[0].result.hits || []
        };
      }
      return {
        fields: {},
        hits: {}
      };
    },

    facetsQuery: function(searchParameters, config) {
      var predicate = (config && config.aggregationType ? commonTransforms.getDatabaseTypeFromUiType(config.aggregationType) : undefined);
      var template = getTemplateFromSearchParameters(searchParameters, false);
      var groupBy = {
        limit: (config && config.pageSize ? config.pageSize : 0),
        offset: 0
      };
      var orderBy;

      if(predicate) {
        template.selects.push({
          'function': 'count',
          type: 'function',
          variable: '?' + predicate
        });

        template.clauses.push({
          isOptional: false,
          predicate: predicate,
          variable: '?' + predicate
        });

        groupBy.variables = [{
          variable: '?' + predicate
        }];

        orderBy = {
          values: [{
            'function': (config && config.sortOrder === '_term' ? undefined : 'count'),
            order: (config && config.sortOrder === '_term' ? 'asc' : 'desc'),
            variable: '?' + predicate
          }]
        };
      }

      return {
        SPARQL: {
          'group-by': groupBy,
          'order-by': orderBy,
          select: {
            variables: template.selects
          },
          where: {
            clauses: template.clauses,
            filters: template.filters,
            type: 'Ad',
            variable: '?ad'
          }
        },
        type: 'Aggregation'
      };
    },

    cityAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var city = commonTransforms.getLocationDataFromId(bucket.key).city;
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: city,
          link: commonTransforms.getLink(bucket.key, 'location'),
          text: city
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      }).filter(function(city) {
        return city.text;
      });
    },

    emailAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var id = ('' + bucket.key).toLowerCase();
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: id,
          link: commonTransforms.getLink(bucket.key, 'email')
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    filterAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var id = ('' + bucket.key).toLowerCase();
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: id
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    phoneAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: bucket.key,
          link: commonTransforms.getLink(bucket.key, 'phone'),
          text: commonTransforms.getFormattedPhone(bucket.key)
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    socialMediaAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var id = ('' + bucket.key).toLowerCase();

        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: id.substring(id.indexOf(' ') + 1, id.length),
          link: commonTransforms.getLink(bucket.key, 'social'),
          text: id
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    reviewAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var id = ('' + bucket.key).toLowerCase();
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: commonTransforms.getExtractionDataFromCompoundId(bucket.key).id,
          link: commonTransforms.getLink(bucket.key, 'review'),
          text: id
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    // Heights, prices, weights, etc.
    compoundExtractionAggregations: function(response, key) {
      var property = commonTransforms.getDatabaseTypeFromUiType(key);
      var data = getAggregationDataFromResponse(response, property);
      return data.map(function(bucket) {
        var extractionData = commonTransforms.getExtractionDataFromCompoundId(bucket.key);
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: extractionData.id,
          text: extractionData.text
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      }).filter(function(extraction) {
        return extraction.text;
      });
    }
  };
});

