#!/usr/bin/env bash

echo 'creating dig-annotations index ...'
curl -XPUT localhost:9200/dig-annotations -d '
{
  "mappings" : {
    "annotation" : {
      "properties" : {
        "cdr_id" : {
          "type" : "string",
          "index" : "not_analyzed"
        },
        "uri" : {
          "type" : "string",
          "index" : "not_analyzed"
        },
        "user" : {
          "type" : "string",
          "index": "not_analyzed"
        },
        "label" : {
          "type" : "string",
          "index": "not_analyzed"
        },
        "justification" : {
          "type" : "string",
          "index" : "not_analyzed"
        },
        "timestamp" : {
          "type" : "date"
        }
      }
    }
  }
}
';
