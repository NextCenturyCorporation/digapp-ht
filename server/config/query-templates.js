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

    // query for offer timeline on phone.html, email.html, and seller.html
    offerTimeline: {
       "aggs": {
          "offersPhone": {
             "filter": {
                "term": {
                   "{{field}}": "{{value}}"
                }
             },
             "aggs": {
                "offerTimeline": {
                   "date_histogram": {
                      "field": "validFrom",
                      "interval": "day"
                   }
                }
             }
          }
       },
       "size": 0
    },
    //offer locations for phone.html
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
    // Who: Give a sense of who is using this phone/email
    // note that in current index, aggregations on hair color, eye color, and ethnicity come back empty
    // and that ethnicity is missing from offer type
    phoneOrEmailPeopleAgg: {
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
        }
    },
    phoneOrEmailPeopleAggForImages: {
       "query": {
           "ids":{
                "values": "{{value}}"
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
        }
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
            "page_revisions" : {
                "date_histogram": {
                    "field": "dateCreated",
                    "interval": "week"
                }
            }
        }
    },
    // person entity queries
    // same agg is done under seller
    personRelatedPhones: {
        query: {
            "query": {
                "filtered": {
                    "filter": {
                        "terms": {
                            "telephone.name.raw": []
                        }
                    }
                }
            },
            "aggs":{
                "assoc_numbers": {
                    "terms": {
                        "field": "telephone.name.raw",
                        "size": 0
                    }
                }
            }
        },
        pathToValueRelativeToQuery: 'query.filtered.filter.terms["telephone.name.raw"]'
    },
    personRelatedEmails: {
        query: {
            "query": {
                "filtered": {
                    "filter": {
                        "terms": {
                            "email.name.raw": []
                        }
                    }
                }
            },
            "aggs":{
                "assoc_emails": {
                    "terms": {
                        "field": "email.name.raw",
                        "size": 0
                    }
                }
            }
        },
        pathToValueRelativeToQuery: 'query.filtered.filter.terms["email.name.raw"]'
    },
    // used on other entity views as well (w/different aggregation names)
    personOfferAgg: {
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
            "offers_with_person" : {
                "date_histogram": {
                    "field": "validFrom",
                    "interval": "week"
                }
            },
            "locs_for_person" : {
                "terms" : {
                    "field" : "availableAtOrFrom.address.addressLocality",
                    "size": 0
                }
            },
            // adding to get aggregate of all phones and emails
            "phones_for_person": {
                "terms" : {
                    "field" : "offer.seller.telephone.name.raw",
                    "size": 0
                }
            },
            "emails_for_person": {
                "terms" : {
                    "field" : "offer.seller.email.name.raw",
                    "size": 0
                }
            }
        }
    },
    itineraryPhone:{
      "aggs": {
        "phone": {
          "filter": {
            "term": {
              '{{field}}': '{{value}}'
            }
          },
          "aggs": {
            "timeline": {
              "date_histogram": {
                "field": "validFrom",
                "interval": "day"
              },
              "aggs": {
                "city": {
                  "terms": {
                    "field": "availableAtOrFrom.address.key",
                    "size": 500
                  },
                  "aggs": {
                    "publisher": {
                      "terms": {
                        "field": "mainEntityOfPage.publisher.name.raw",
                        "size": 500
                      }
                    },
                    "mentions": {
                      "terms": {
                        "field": "mainEntityOfPage.mentions",
                        "size": 500
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
    },

    locationTimeline: {
       "aggs": {
          "offersPhone": {
             "filter": {
                "term": {
                   "{{field}}": "{{value}}"
                }
             },
             "aggs": {
                "offerTimeline": {
                   "date_histogram": {
                      "field": "validFrom",
                      "interval": "day"
                   },
                    "aggs": {
                        "localities": {
                            "terms": {
                                "field": "availableAtOrFrom.address.key",
                                "order" : { "_term" : "asc" }
                            }
                        }
                    }
                },
                "locations": {
                    "terms": {
                        "field": "availableAtOrFrom.address.key",
                        "size": 0
                    }
                }
             }
          }
       },
       "size": 0
    }

  }
};
