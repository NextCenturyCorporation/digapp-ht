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

  function getAggregationDataFromResponse(response, config) {
    if(config && config.networkExpansionQuery) {
      if(response && response.length && response[0].result && response[0].result.length > 1 && response[0].result[1].aggregations && response[0].result[1].aggregations['?' + config.name]) {
        return response[0].result[1].aggregations['?' + config.name].buckets || [];
      }
    } else {
      if(response && response.length && response[0].result && response[0].result.aggregations && response[0].result.aggregations['?' + config.name]) {
        return response[0].result.aggregations['?' + config.name].buckets || [];
      }
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

  // network expansion queries are structured a bit differently, the main difference being that they have nested clauses
  function getTemplateFromSearchParametersAndNetworkParameters(searchParameters, networkExpansionParameters, optional) {
    var predicates = {};
    var template = {
      clauses: [{clauses: [], type: 'Ad', variable: '?ad1'}],
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
              // we only want to add exact search terms entered in by the user to the initial query, not the expanded query
              template.clauses[0].clauses.push({
                constraint: searchParameters[type][term].key,
                isOptional: optional,
                predicate: predicate
              });

              if(!networkExpansionParameters[type]) {
                template.clauses.push({
                  constraint: searchParameters[type][term].key,
                  isOptional: optional,
                  predicate: predicate
                });
              }
            }
          }
        });
        if(!predicates[predicate] && networkExpansionParameters[type]) {
          predicates[predicate] = (predicates[predicate] || 0) + 1;
        }
      });

      _.keys(predicates).forEach(function(predicate) {
        for(var i = 1; i <= predicates[predicate]; ++i) {
          template.clauses.push({
            isOptional: false,
            predicate: predicate === 'date' ? 'posting_date' : predicate,
            variable: predicate === 'date' ? '?' + predicate + i : '?' + predicate,
          });

          template.clauses[0].clauses.push({
            isOptional: false,
            predicate: predicate === 'date' ? 'posting_date' : predicate,
            variable: predicate === 'date' ? '?' + predicate + i : '?' + predicate,
          });
        }
      });
    }

    return template;
  }

  return {
    adQuery: function(searchParameters, config, networkExpansionParameters) {
      var networkExpansionQuery = _.findKey(networkExpansionParameters, function(param) { return param === true; }) ? true : false;
      var adVariableName = networkExpansionQuery ? '?ad2' : '?ad';
      var template = networkExpansionQuery ? getTemplateFromSearchParametersAndNetworkParameters(searchParameters, networkExpansionParameters, true) : getTemplateFromSearchParameters(searchParameters, true);
      var groupBy = (!config || !config.page || !config.pageSize) ? undefined : {
        limit: config.pageSize,
        offset: (config.page - 1) * config.pageSize
      };

      return {
        SPARQL: {
          'group-by': groupBy,
          select: {
            variables: networkExpansionQuery ? [{variable: '?ad2'}] : template.selects
          },
          where: {
            clauses: template.clauses,
            filters: template.filters,
            type: 'Ad',
            variable: adVariableName
          }
        },
        type: 'Point Fact'
      };
    },

    adResults: function(response, config) {
      var fields = {};

      // network expansion queries return an array of two result records instead of a single result
      if(config && config.networkExpansionQuery) {
        if(response && response.length && response[0].result && response[0].result.length > 1) {
          if(response[0].query && response[0].query.SPARQL && response[0].query.SPARQL.where && response[0].query.SPARQL.where.clauses && response[0].query.SPARQL.where.clauses.length && response[0].query.SPARQL.where.clauses[0].clauses && response[0].query.SPARQL.where.clauses[0].clauses.length) {
            response[0].query.SPARQL.where.clauses[0].clauses.forEach(function(clause) {
              if(clause.predicate && clause.constraint && clause._id) {
                var type = commonTransforms.getUiTypeFromDatabaseType(clause.predicate);
                fields[type] = fields[type] || {};
                fields[type][clause.constraint.toLowerCase()] = clause._id;
              }
            });
          }
          return {
            fields: fields,
            hits: response[0].result[1].hits || []
          };
        }
      } else {
        if(response && response.length && response[0].result) {
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
      }

      return {
        fields: {},
        hits: {}
      };
    },

    facetsQuery: function(searchParameters, config, networkExpansionParameters) {
      var networkExpansionQuery = _.findKey(networkExpansionParameters, function(param) { return param === true; }) ? true : false;
      var predicate = (config && config.aggregationType ? commonTransforms.getDatabaseTypeFromUiType(config.aggregationType) : undefined);
      var template = networkExpansionQuery ? getTemplateFromSearchParametersAndNetworkParameters(searchParameters, networkExpansionParameters, true) : getTemplateFromSearchParameters(searchParameters, false);
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

        if(!networkExpansionQuery || (_.findIndex(template.clauses, function(clause) {
          return clause.predicate === predicate && clause.variable === '?' + predicate;
        }) === -1)) {
          template.clauses.push({
            isOptional: false,
            predicate: predicate,
            variable: '?' + predicate
          });

          if(template.clauses.length && template.clauses[0].clauses) {
            template.clauses[0].clauses.push({
              isOptional: false,
              predicate: predicate,
              variable: '?' + predicate
            });
          }
        }

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

    cityAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

    emailAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

    filterAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

    phoneAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

    socialMediaAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

    reviewAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
      return data.map(function(bucket) {
        var extractionData = commonTransforms.getExtractionDataFromCompoundId(bucket.key);
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        return {
          count: bucket.doc_count,
          id: extractionData.id,
          link: commonTransforms.getLink(bucket.key, 'review'),
          text: extractionData.text
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      });
    },

    // Heights, prices, weights, etc.
    compoundExtractionAggregations: function(response, config) {
      if(!config || !config.name) {
        return [];
      }
      var newConfig = {
        name: commonTransforms.getDatabaseTypeFromUiType(config.name),
        networkExpansionQuery: config.networkExpansionQuery
      };
      var data = getAggregationDataFromResponse(response, newConfig);
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

