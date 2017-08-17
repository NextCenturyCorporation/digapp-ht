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

  function getTemplateFromSearchParameters(searchParameters, networkExpansionParameters) {
    var predicates = {};
    var template = {
      clauses: !networkExpansionParameters ? [] : [{
        clauses: [],
        type: 'Ad',
        variable: '?ad1'
      }],
      filters: []
    };
    var andFilter = {
      clauses: [],
      operator: 'and'
    };
    var notFilter = {
      clauses: [],
      operator: 'not exists'
    };

    if(!_.isEmpty(searchParameters)) {
      _.keys(searchParameters).forEach(function(type) {
        var predicate = commonTransforms.getDatabaseTypeFromUiType(type);
        var unionClause = {
          clauses: [],
          operator: 'union'
        };

        _.keys(searchParameters[type]).forEach(function(term) {
          if(searchParameters[type][term].enabled) {
            if(type === 'postingDate') {
              // Use only a single date variable ('date1').
              predicates.date = [{
                optional: false
              }];

              andFilter.clauses.push({
                constraint: searchParameters[type][term].date,
                operator: term === 'dateStart' ? '>' : '<',
                variable: '?date1'
              });
            } else if(predicate && searchParameters[type][term].search === 'excluded') {
              notFilter.clauses.push({
                constraint: searchParameters[type][term].key,
                predicate: predicate
              });
            } else if(predicate && searchParameters[type][term].search === 'union') {
              unionClause.clauses.push({
                constraint: searchParameters[type][term].key,
                isOptional: false,
                predicate: predicate
              });
            } else if(predicate) {
              var optional = (searchParameters[type][term].search !== 'required');
              if(!networkExpansionParameters) {
                predicates[predicate] = predicates[predicate] || [];
                predicates[predicate].push({
                  optional: optional
                });

                template.clauses.push({
                  constraint: searchParameters[type][term].key,
                  isOptional: optional,
                  predicate: predicate
                });
              } else {
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
          }
        });

        if(unionClause.clauses.length) {
          template.clauses.push(unionClause);
        }

        if(networkExpansionParameters && networkExpansionParameters[type] && !predicates[predicate]) {
          // TODO Should predicate variables for network expansion queries always be required?
          predicates[predicate] = [{
            optional: false
          }];
        }
      });

      _.keys(predicates).forEach(function(predicate) {
        for(var i = 1; i <= predicates[predicate].length; ++i) {
          if(!networkExpansionParameters) {
            template.clauses.push({
              isOptional: predicates[predicate][i - 1].optional,
              predicate: predicate === 'date' ? 'posting_date' : predicate,
              variable: '?' + predicate + i
            });
          } else {
            template.clauses.push({
              isOptional: predicates[predicate][i - 1].optional,
              predicate: predicate === 'date' ? 'posting_date' : predicate,
              variable: (predicate === 'date' ? ('?' + predicate + i) : ('?' + predicate))
            });

            template.clauses[0].clauses.push({
              isOptional: predicates[predicate][i - 1].optional,
              predicate: predicate === 'date' ? 'posting_date' : predicate,
              variable: (predicate === 'date' ? ('?' + predicate + i) : ('?' + predicate))
            });
          }
        }
      });
    }

    if(andFilter.clauses.length) {
      template.filters.push(andFilter);
    }

    if(notFilter.clauses.length) {
      template.filters.push(notFilter);
    }

    return template;
  }

  return {
    adQuery: function(searchParameters, config) {
      var networkExpansionParameters = config ? config.custom : {};
      var networkExpansionQuery = _.findKey(networkExpansionParameters, function(param) { return param === true; }) ? true : false;
      var template = getTemplateFromSearchParameters(searchParameters, networkExpansionQuery ? networkExpansionParameters : undefined);
      var groupBy = (!config || !config.page || !config.pageSize) ? undefined : {
        limit: config.pageSize,
        offset: (config.page - 1) * config.pageSize
      };

      return {
        SPARQL: {
          'group-by': groupBy,
          select: {
            variables: [{
              type: 'simple',
              variable: !networkExpansionQuery ? '?ad' : '?ad2'
            }]
          },
          where: {
            clauses: template.clauses,
            filters: template.filters,
            type: 'Ad',
            variable: !networkExpansionQuery ? '?ad' : '?ad2'
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

    facetsQuery: function(searchParameters, config) {
      var networkExpansionParameters = config ? config.custom : {};
      var networkExpansionQuery = _.findKey(networkExpansionParameters, function(param) { return param === true; }) ? true : false;
      var predicate = (config && config.aggregationType ? commonTransforms.getDatabaseTypeFromUiType(config.aggregationType) : undefined);
      var template = getTemplateFromSearchParameters(searchParameters, networkExpansionQuery ? networkExpansionParameters : undefined);
      var groupBy = {
        limit: (config && config.pageSize ? config.pageSize : 0),
        offset: 0
      };
      var orderBy;
      var selects;

      if(predicate) {
        selects = [{
          'function': 'count',
          type: 'function',
          variable: '?' + predicate
        }];

        // TODO What does this if statement mean?
        if(!networkExpansionQuery || (_.findIndex(template.clauses, function(clause) {
          return clause.predicate === predicate && clause.variable === '?' + predicate;
        }) === -1)) {
          template.clauses.push({
            isOptional: false,
            predicate: predicate,
            variable: '?' + predicate
          });

          if(networkExpansionQuery && template.clauses.length && template.clauses[0].clauses) {
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
            variables: selects || []
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

