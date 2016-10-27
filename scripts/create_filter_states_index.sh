#!/usr/bin/env bash

echo 'creating dig-filter-states index ...'
curl -XPUT localhost:9200/dig-filter-states -d '
{
  "mappings" : {
    "item" : {
      "properties" : {
        "id" : {
          "type" : "string",
          "index" : "not_analyzed"
        },
        "state" : {
          "type" : "string",
          "index" : "not_analyzed"
        }
      }
    }
  }
}
';
