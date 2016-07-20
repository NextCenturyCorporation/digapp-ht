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

    commonTermsPathToValueQuery: {
        query:{
            terms:{}
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
            "page_revisions": {
                "date_histogram": {
                    "field": "dateCreated",
                    "interval": "week"
                }
            }
        }
    }
  }
};
