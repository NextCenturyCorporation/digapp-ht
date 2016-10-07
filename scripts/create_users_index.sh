#!/usr/bin/env bash

echo 'creating dig-users index ...'
curl -XPUT localhost:9200/dig-users -d '
{
  "mappings" : {
    "user": {
      "properties": {
        "username": {
          "type": "string",
          "index": "not_analyzed"
        },
        "emailAddress": {
          "type": "string",
          "index": "not_analyzed"
        },
        "advancedSearch": {
          "type": "boolean"
        },
        "blurImages": {
          "type": "boolean"
        },
        "notificationFrequency": {
          "type": "string",
          "index": "not_analyzed"
        },
        "defaultSort": {
          "type": "string"
        },
        "savedQueries": {
          "properties": {
            "name": {
              "type": "string",
              "index": "not_analyzed"
            },
            "digUIState": {
              "properties" :{
                "searchText": {
                  "type": "string"
                },
                "facets": {
                  "type": "string"
                }
              }
            },
            "esState": {
              "properties" : {
                "query": {
                  "type": "string"
                },
                "filter": {
                  "type": "string"
                }
              }
            },
            "createdBy": {
              "type": "string",
              "index": "not_analyzed"
            },
            "createdAt": {
              "type": "date",
              "format" : "dateOptionalTime"
            },
            "lastRunDate": {
              "type": "date",
              "format" : "dateOptionalTime"
            },
            "notificationDate": {
              "type": "date",
              "format" : "dateOptionalTime"
            },
            "notificationHasRun": {
              "type": "boolean"
            },
            "sendEmailNotification": {
              "type": "boolean"
            }
          }
        },
        "receivedQueries": {
          "properties": {
            "name": {
              "type": "string",
              "index": "not_analyzed"
            },
            "digUIState": {
              "properties" :{
                "searchType": {
                  "type": "string"
                },
                "searchText": {
                  "type": "string"
                },
                "facets": {
                  "type": "string"
                }
              }
            },
            "esState": {
              "properties" : {
                "esType": {
                  "type": "string"
                },
                "query": {
                  "type": "string"
                },
                "filter": {
                  "type": "string"
                }
              }
            },
            "createdBy": {
              "type": "string",
              "index": "not_analyzed"
            },
            "createdAt": {
              "type": "date",
              "format" : "dateOptionalTime"
            }
          }
        },
        "dateCreated": {
          "type": "date",
          "format" : "dateOptionalTime"
        }
      }
    }
  }
}';
