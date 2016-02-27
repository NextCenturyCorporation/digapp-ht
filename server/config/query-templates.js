'use strict';

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
            },
            // Who: Give a sense of who is using this phone 
            // note that in current index, aggregations on hair color, eye color, and ethnicity come back empty
            // and that ethnicity is missing from offer type
            'people_names': {
                'terms': {
                    'field': 'itemOffered.name'
                }
            },
            'people_ages': {
                'terms': {
                    'field': 'itemOffered.personAge'
                }
            },
            'people_eye_colors': {
                'terms': {
                    'field': 'itemOffered.eyeColor'
                }
            },
            'people_hair_color': {
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
    },
    offer: {
        query: {
            match:{ '{{field}}' : '{{value}}' }
        }
    }
  }
};
