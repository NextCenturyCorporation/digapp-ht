'use strict';

module.exports = {

  QUERY_TEMPLATES: {
    // annotation query -- using 'mockUser' for now until user support is added
    annotationQuery: {
        query: {
            query: {
                bool : {
                    must : [
                        {
                            term : { uri : '' }
                        },
                        {
                            term : { user : '' }
                        }
                    ]
                }
            }
        },
        pathsToValues: [
            'query.bool.must[0].term.uri', 'query.bool.must[1].term.user'
        ]
    },
    // Common query used among entities
    commonMatchQuery: {
        query:{
            match:{ '{{field}}' : '{{{value}}}' }
        }
    },

    commonTermQuery: {
        query:{
            term:{ '{{field}}' : '{{{value}}}' }
        }
    },

    commonMatchQueryOfferSorted: {
        query:{
            match:{ '{{field}}' : '{{value}}' }
        },
        "sort": [
                  {
                    "validFrom": {
                    "order": "desc"
                }
            }
        ] 
    },

    offerLocation:{
      "aggs": {
        "phone": {
          "filter": {
            "term": {
              "{{field}}": "{{value}}"
            }
          },
          "aggs": {
            "city": {
              "terms": {
                "field": "availableAtOrFrom.address.key",
                "size": 0
              }
            }
          }
        }
      },
      "size": 0
    },

    peopleFeatures: {
      "query": {
        "filtered": {
          "filter": {
            "terms": {
              "{{filterField}}": ["{{filterValue}}"]
            }
          }
        }
      },
      "aggs": {
        "people_features": {
          "terms": {
            "field": "{{aggregationField}}",
            "size": 0
          }
        }
      }
    },
    phoneOrEmailPeopleAggForImages: {
       "query": {
           "ids":{
                "{{filterField}}": ["{{filterValue}}"]
           }
       },
       "aggs" : {
           "people_names": {
               "terms": {
                   "field": "name.raw",
                   "size": 0
               }
           },
           "people_ages": {
               "terms": {
                   "field": "age",
                   "size": 0
               }
           },
           "people_ethnicities": {
               "terms": {
                   "field": "ethnicity",
                   "size": 0
               }
           }
       }
    },
    // same one used in phone/email
    sellerPeopleAggs: {
        "query": {
            "filtered": {
                "filter": {
                    "term": {
                        "{{field}}": "{{value}}"
                    }
                }
            }
        },
        "aggs" : {
            "people_names": {
                "terms": {
                    "field": "name.raw",
                    "size": 0
                }
            },
            "people_ages": {
                "terms": {
                    "field": "age",
                    "size": 0
                }
            },
            "people_ethnicities": {
                "terms": {
                    "field": "ethnicity",
                    "size": 0
                }
            }
        },
    },

    offerRevisions: {
        query: {
            "query": {
                "filtered": {
                    "query": {
                        "match": { 'mainEntityOfPage.url.raw' : '' }
                    },
                    "filter": {
                        "not": {
                            "term": { 'uri' : '' }
                        }
                   }
                }
            }
        },
        pathsToValues: [
            "query.filtered.query.match['mainEntityOfPage.url.raw']",
            "query.filtered.filter.not.term['uri']"
        ]
      
   },

    // webpage entity queries
    webpageRevisions: {
        "query": {
            "filtered": {
                "filter": {
                    "term": {
                        '{{field}}' : '{{value}}'
                    }
                }
            }
        },
        "aggs": {
            "page_revisions": {
                "date_histogram": {
                    "field": "dateCreated",
                    "interval": "week"
                }
            }
        }
    },

    locationTimeline: {
      "aggs": {
        "location_timeline": {
          "filter": {
            "term": {
              '{{field}}': '{{value}}'
            }
          },
          "aggs": {
            "dates": {
              "date_histogram": {
                "field": "validFrom",
                "interval": "day"
              },
              "aggs": {
                "locations": {
                  "terms": {
                    "field": "availableAtOrFrom.address.key",
                    "order": { "_term" : "asc" },
                    "size": 0
                  },
                  "aggs": {
                    "publisher": {
                      "terms": {
                        "field": "mainEntityOfPage.publisher.name.raw",
                        "size": 0
                      }
                    },
                    "mentions": {
                      "terms": {
                        "field": "mainEntityOfPage.mentions",
                        "size": 0
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "size": 0
    }
  }
};
