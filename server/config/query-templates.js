'use strict';

// Use local.env.js for environment variables that grunt will set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {

  QUERY_TEMPLATES: {
    phone: {
        query: {
          filtered:{
            query:{
              match:{ '{{field}}' : '{{value}}' }
            }
          }
        },
        size: 0,
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
            },
            // Who: Give a sense of who is using this phone 
            // note that in current index, aggregations on hair color, eye color, and ethnicity come back empty
            // and that ethnicity is missing from offer type
            'service_by_name': {
                'terms': {
                    'field': 'itemOffered.name'
                }
            },
            'service_by_age': {
                'terms': {
                    'field': 'itemOffered.personAge'
                }
            },
            'service_by_eye_color': {
                'terms': {
                    'field': 'itemOffered.eyeColor'
                }
            },
            'service_by_hair_color': {
                'terms': {
                    'field': 'itemOffered.hairColor'
                }
            },
            // Relations
            'related_phones' : {
                'terms' : { 
                    'field' : 'offer.seller.telephone.name' 
                },
                'aggs' : {
                    // Timeline similarities
                    'related_phone_timelines': {
                        'date_histogram': {
                            'field': 'validFrom',
                            'interval': 'week'
                        }
                    } 
                }         
            },
            'related_emails' : {
                'terms' : { 
                    'field' : 'offer.seller.email.name' 
                }          
            },
            'related_websites' : {
                'terms' : { 
                    'field' : 'mainEntityOfPage.publisher.name' 
                }          
            }
        }
    }
  }
};
