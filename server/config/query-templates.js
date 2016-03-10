'use strict';

module.exports = {

  QUERY_TEMPLATES: {
    // phone/email page queries
    phoneOrEmail: {
        query: {
            filtered:{
                query:{
                    match:{ '{{field}}' : '{{value}}' }
                }
            }
        }
    },
    phoneOrEmailOfferAgg: {
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
    // Relations
    phoneOrEmailSellerAgg: {
        "query": {
            "match": {
                "{{field}}": "{{value}}"
            }   
        },
        "aggs" : {
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
    }
  }
};
