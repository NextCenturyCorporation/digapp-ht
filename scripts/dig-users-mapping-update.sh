#!/usr/bin/env bash

echo 'adding message field to dig-users index ...'
curl -XPUT localhost:9200/dig-users/_mapping/user -d '
{
  "properties": {
    "receivedQueries": {
      "properties": {
        "message": {
          "type": "string",
          "index": "no"
        }
      }
    } 
  }
}';