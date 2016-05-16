# digapp-ht
Web application for searching and exploring entity graphs in Elasticsearch indices

## Overview

## Prerequisites
* node.js - download and install node.js
* gulp.js - npm i -g gulp
* bower.js - npm i -g bower
* polyserve - npm i -g polyserve
* web component tester - npm i -g web-component-tester
* elastic search server with ht data index.  See elastic.co

## Installation
* clone this repo
* 
  ```sh
    cd digapp-ht && npm install && bower install
  ```

## Getting started
* create digapp-ht/server/config/local.env.js with contents that look like:

    ```JavaScript

    'use strict';

    // Use local.env.js for environment variables that gulp will set when 
    // the server starts locally.
    // Use for your api keys, secrets, etc. This file should not be tracked by git.
    //
    // You will need to set these on the server you deploy to.

    module.exports = {
        ELASTIC_CONFIG:'{"host":"http://vinisvr:9200"}',
        ELASTIC_INDEX:'dhtcat1op'
    };
  ```
  
## Development workflow

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be used on devices connected to your network.

#### Run tests

```sh
gulp test:local
```

This runs the unit tests defined in the `app/test` directory through [web-component-tester](https://github.com/Polymer/web-component-tester).

To run tests Java 7 or higher is required. To update Java go to http://www.oracle.com/technetwork/java/javase/downloads/index.html and download ***JDK*** and install it.

#### Build & Vulcanize

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes vulcanization, image, script, stylesheet and HTML optimization and minification.


## Unit Testing

Web apps built with Polymer Starter Kit come configured with support for [Web Component Tester](https://github.com/Polymer/web-component-tester) - Polymer's preferred tool for authoring and running unit tests. This makes testing your element based applications a pleasant experience.

[Read more](https://github.com/Polymer/web-component-tester#html-suites) about using Web Component tester.

Fork Test

