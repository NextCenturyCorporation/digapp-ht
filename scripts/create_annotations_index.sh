#!/usr/bin/env bash

echo 'creating dig-annotations index ...'
curl -XPUT localhost:9200/dig-annotations -d '
{
  "mappings" : {
    "annotation" : {
      "properties" : {
        "uri" : {
          "type" : "string",
          "index" : "not_analyzed"
        },
        "user" : {
          "type" : "string",
          "index": "not_analyzed"
        },
        "is_valuable" : {
          "type" : "boolean"
        },
        "free_text" : {
          "type" : "string",
          "index" : "not_analyzed"
        }
      }
    }
  }
}
';