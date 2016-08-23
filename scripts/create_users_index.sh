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
          "type": "boolean",
          "index": "not_analyzed"
        },
        "blurImages": {
          "type": "boolean",
          "index": "not_analyzed"
        },
        "savedQueries": {
          "properties": {
            "name": {
              "type": "string",
              "index": "not_analyzed"
            },
            "digUIState": {
              "properties" :{
                "query": {
                  "type": "string"
                },
                "filters": {
                  "type": "string"
                }
              }
            },
            "esState": {
              "type": "string"
            },
            "frequency": {  
              "type": "string",
              "index": "not_analyzed"
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
              "type": "boolean",
              "index": "not_analyzed"
            },
            "createdBy": {
              "type": "string",
              "index": "not_analyzed"
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
