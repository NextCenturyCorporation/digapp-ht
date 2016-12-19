#!/usr/bin/env bash

echo 'creating dig-annotations index ...'
#curl -XPUT localhost:9200/dig-annotations -d '
curl -XPUT http://memex:digdig@52.36.12.77:8080/dig-annotations -d '
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
        },
        "latest" : {
          "type" : "boolean"
        }
      }
    }
  }
}
';
