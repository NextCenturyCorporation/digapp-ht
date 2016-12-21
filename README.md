
# digapp-ht
Web application for searching and exploring entity graphs in Elasticsearch indices.


## Overview
This web application is built primarily with [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) using the [Polymer](https://github.com/Polymer/polymer) library.  The technology stack also includes [Node.js](https://nodejs.org/en/), [Express.js](http://expressjs.com), [Gulp.js](gulpjs.com), [Elastic Search Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html), [Elastic.js](https://github.com/fullscale/elastic.js/) and many other Bower and NPM javascript modules.  The public web components used in this application and others are located in [DigElements](https://github.com/DigElements).

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
        ELASTIC_INDEX:'dhtcat1op',
        ANNOTATION_INDEX: 'dig-annotations',
        ANNOTATION_TYPE: 'annotation'
    };
  ```
  
## Development workflow

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be used on devices connected to your network.

#### Run tests
To successfully run unit tests, you must have a copy of sample data for the elastic search index that this application
will use.  These are kept in [dig-data](https://github.com/usc-isi-i2/dig-data/tree/master/sample-datasets/dig2app)

```sh
gulp test:local
```

This runs the unit tests defined in the `app/test` directory through [web-component-tester](https://github.com/Polymer/web-component-tester).

#### Build & Vulcanize

First update the version in package.json.  Then run:

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes vulcanization, image, script, stylesheet and HTML optimization and minification.  The version from package.json will also be available in the user settings dropdown menu (the gear icon in the upper-right corner of each page).


## Unit Testing

The client code uses [Web Component Tester](https://github.com/Polymer/web-component-tester) 

[Read more](https://github.com/Polymer/web-component-tester#html-suites) about using Web Component tester.

## Contributing
Pull requests are welcome.  Please fork this repo, then create a topic branch on your forked copy.  Ensure that all unit tests are working **before** and **after** making modifications on your topic branch.  Add necessary unit tests to accompany your feature or bug fix, and then submit a pull request with upstream branch set to the default (master) branch, and downstream branch set to your topic branch on your forked repo.

## Deployment

First update the version in package.json.  Then run:

```sh
gulp docker
```

This will build & vulcanize the application, build the docker container (using the version from package.json), and push it to docker hub.

## License

[Apache 2.0](https://github.com/NextCenturyCorporation/digapp-ht/blob/master/LICENSE)
