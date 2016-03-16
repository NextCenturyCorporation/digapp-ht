'use strict';

module.exports = {

  QUERY_TEMPLATES: {
    // phone/email page queries
    // TODO: make common query if all entities use a match query to start
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
    // not being used yet on offer
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
    // seller entity queries
    seller: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    },
    // phone and email aggregations might be able to be performed together when
    // entity resolution is done on seller
    sellerPhoneAggs: {
        "query": {
            "filtered": {
                "filter": {
                    "term": {
                        '{{field}}' : '{{value}}'
                    }
                }
            }
        },
        "aggs":{
            "seller_assoc_numbers": {
                "terms": {
                    "field": "telephone.name"
                }
            }
        }
    },
    sellerEmailAggs: {
        "query": {
            "filtered": {
                "filter": {
                    "term": {
                        '{{field}}' : '{{value}}'
                    }
                }
            }
        },
        "aggs":{
            "seller_assoc_emails": {
                "terms": {
                    "field" : "email.name"
                }
            }
        }
    },
    // TODO: reorganize queries -- duplicate of offerSellerAgg
    offerAggsBySeller: {
        "query": {
            "match": {
                '{{field}}' : '{{value}}'
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
    // webpage entity queries
    webpage: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    },
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
    relatedEntityQuery: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    },
    // person entity queries
    person: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    },
    // same agg is done under seller
    personRelatedPhones: {
        "query": {
            "filtered": {
                "filter": {
                    "term": {
                        '{{field}}' : '{{value}}'
                    }
                }
            }
        },
        "aggs":{
            "assoc_numbers": {
                "terms": {
                    "field": "telephone.name"
                }
            }
        }
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
        size: 40, // TODO: add paging
        "aggs": {
            "offers_with_person" : {
                "date_histogram": {
                    "field": "validFrom",
                    "interval": "week"
                }
            },
            "locs_for_person" : {
                "terms" : {
                    "field" : "availableAtOrFrom.address.addressLocality" 
                }
            },
            // adding to get aggregate of all phones and emails
            "phones_for_person": {
                "terms" : {
                    "field" : "seller.telephone.name"
                }
            },
            "emails_for_person": {
                "terms" : {
                    "field" : "seller.email.name"
                }
            
            }
        }
    }
  }
};
