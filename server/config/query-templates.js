'use strict';

module.exports = {

  QUERY_TEMPLATES: {
    // phone page queries
    phone: {
        query: {
            filtered:{
                query:{
                    match:{ '{{field}}' : '{{value}}' }
                }
            }
        }
    },
    phoneOfferAgg: {
        query: {
          filtered:{
            query:{
                match:{ '{{field}}' : '{{value}}' }
            }
          }
        },
        size: 40, // TODO: add paging
        'aggs' : {
            // When: Timeline of offers
            'offers_by_date': {
                'date_histogram': {
                    'field': 'validFrom',
                    'interval': 'week'
                }
            },
            // Where: Map showing offers by location
            'offers_by_city': {
                'terms': {
                    'field': 'availableAtOrFrom.address.addressLocality'
                }
            }
        }
    },
    // Who: Give a sense of who is using this phone 
    // note that in current index, aggregations on hair color, eye color, and ethnicity come back empty
    // and that ethnicity is missing from offer type
    phonePeopleAgg: {
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
                    "field": "name"
                }
            },
            "people_ages": {
                "terms": {
                    "field": "personAge"
                }
            },
            "people_ethnicities": {
                "terms": {
                    "field": "ethnicity"
                }
            },
            "people_eye_colors": {
                "terms": {
                    "field": "eyeColor"
                }
            },
            "people_hair_color": {
                "terms": {
                    "field": "hairColor"
                }
            }
        }
    },
    phoneSellerAgg: {
        "query": {
            "match": {
                "{{field}}": "{{value}}"
            }   
        },
        "aggs" : {
            // Relations
            "related_phones" : {
                "terms" : { 
                    "field" : "telephone.name" 
                },
                "aggs" : {
                    // Timeline similarities
                    "related_phone_timelines": {
                        "date_histogram": {
                            "field": "makesOffer.validFrom",
                            "interval": "week"
                        }
                    } 
                }   
            },
            "related_emails" : {
                "terms" : { 
                    "field" : "email.name" 
                }          
            },
            "related_websites" : {
                "terms" : { 
                    "field" : "makesOffer.mainEntityOfPage.publisher.name" 
                }          
            }
        }
    },
    // offer page queries
    offer: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    },
    // not being used yet
    offerSellerAgg: {
        "query": {
            "match": {
                "{{field}}": "{{value}}"
            }   
        },
        "aggs": {
            "offers_by_seller" : {
                "date_histogram": {
                    "field": "validFrom",
                    "interval": "week"
                }     
            },
            "offer_locs_by_seller" : {
                "terms" : { 
                    "field" : "availableAtOrFrom.address.addressLocality" 
                }      
            }        
        }
    },
    relatedPhonesOrEmails: {
        query: {
            "query" : {
                "filtered" : {
                    "filter" : {
                        "terms" : { 
                            "name": []
                        }
                    }
                }
            }
        },
        pathToValueRelativeToQuery: 'query.filtered.filter.terms.name'
    },
    email: {
        "query": {
            "match": {
                match:{ '{{field}}' : '{{value}}' }
            }
        },
        "aggs": {
            "names": {
                "terms": {
                    "field": "itemOffered.name",
                    "size": 0
                }
            },
            "eyeColors": {
                "terms": {
                    "field": "itemOffered.eyeColor",
                    "size": 0
                }
            },
            "hairColors": {
                "terms": {
                    "field": "itemOffered.hairColor",
                    "size": 0
                }
            },
            "ages": {
                "terms": {
                    "field": "itemOffered.personAge",
                    "size": 0
                }
            },
            //This could be changed to a date_histogram agg if the model accepts dates rounded to an interval.
            "offerDates": {
                "terms": {
                    "field": "validFrom",
                    "size": 0
                }
            }
        }
    }
  }
};
