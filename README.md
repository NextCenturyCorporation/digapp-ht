# digapp-ht
DIG search and visualization user interface for the HT domain

## Technologies
* [Polymer](https://github.com/Polymer/polymer)
* [Node.js](https://nodejs.org/en/)
* [Express.js](http://expressjs.com)
* [Gulp.js](http://gulpjs.com)
* [Bower](https://bower.io/)
* [Web Component Tester](https://github.com/Polymer/web-component-tester)
* [Vulcanize](https://github.com/Polymer/polymer-bundler)
* [Docker](https://www.docker.com/)
* [Lodash](https://lodash.com/)
* [JSCS](http://jscs.info/)
* [JSHint](http://jshint.com/)
* [Polymer Elements](https://www.webcomponents.org/author/PolymerElements)
* [DIG Elements](https://github.com/DigElements)
  * [Elastic Search Client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html)
  * [Elastic.js](https://github.com/fullscale/elastic.js/)

## Installation
```
npm install -g gulp-cli
npm install -g gulp
npm install -g bower
npm install -g polyserve
npm install -g web-component-tester
git clone https://github.com/NextCenturyCorporation/digapp-ht.git
cd digapp-ht
npm install
bower install
```

## Configuration
Copy **digapp-ht/server/config/local.env.sample.js** to **digapp-ht/server/config/local.env.js** and edit the available configuration options:

Configuration Option | Description | Default
---------------------|-------------|--------
ELASTIC_CONFIG | The address at which elasticsearch is hosted. | {"host": "http://localhost:9200"}
ELASTIC_INDEX | The elasticsearch index in which the HT ads (and other data) are located. | "dig-data"
ANNOTATION_INDEX | The elasticsearch index in which the user annotations are located. | "dig-annotations"
ANNOTATION_TYPE | The elasticsearch index type of the user annotations. | "annotation"
ANNOTATION_RELEVANT | The label describing why the user annotations are relevant. | "to a counter-human-trafficking case"
CACHE_CONFIG | The address at which elasticsearch is hosted in which the cached ads are located. | {"host": "http://localhost:9200"}
CACHE_INDEX | The elasticsearch index in which the cached HT ads are located. | "memex-domains"
CLASSIFICATION_URL | The endpoint at which the classification service is located.  Only used if DEV is true. |
CLASSIFICATION_ENTITY_URL | The string added to the CLASSIFICATION_URL to create the endpoint to POST entity classifications.  Only used if DEV is true. |
CLASSIFICATION_EXTRACTION_URL | The string added to the CLASSIFICATION_URL to create the endpoint to POST extraction classifications.  Only used if DEV is true. |
CLASSIFICATION_FLAG_URL | The string added to the CLASSIFICATION_URL to create the endpoint to GET classification flags.  Only used if DEV is true. |
DEV | Whether to enable development mode. | false
FILTER_STATES_INDEX | The elasticsearch index in which the filter states are located. | "dig-filter-states"
FILTER_STATES_TYPE | The elasticsearch index type of the filter states. | "item"
IMAGE_SERVICE_AUTH | The authorization needed to use the similar image REST service. | {"user: "", "password": ""}
IMAGE_SERVICE_HOST | The address at which the similar image REST services are located.  The "url" is for GET requests sending a specific image URL.  The "base64" is for POST requests sending specific image base64 data.  | {"url": "", "base64": ""}
LOG_INDEX | The elasticsearch index in which the logs are located. | "dig-logs"
LOG_TYPE | The elasticsearch index type of the logs. | "log"
RAW_ES_DATA_URL | The endpoint at which the elasticsearch data can be accessed through links in the UI.  Document _id is added to the end of the string.  UI links are not shown if URL is undefined. |
USER_INDEX | The elasticsearch index in which the users are located. | "dig-users"
USER_TYPE | The elasticsearch index type of the users. | "user"

## Run Local Server
```
gulp serve
```

## Run Codestyle & Linter
```
gulp lint
```

## Run Unit Tests
To successfully run unit tests, you must have a copy of sample data for the elastic search index that this application
will use.  These are kept in [dig-data](https://github.com/usc-isi-i2/dig-data/tree/master/sample-datasets/dig2app)

```
gulp test
```

## Build & Vulcanize
First update the application version in package.json.  Then run:

```
gulp
```

## Build & Deploy Docker Image
First update the application version in package.json.  Then run:

```
gulp docker
```

This will build & vulcanize the application, build a docker image named **digmemex/digapp:[version]** (using the version from the package.json file) and push it to Docker Hub.

## License

[Apache 2.0](https://github.com/NextCenturyCorporation/digapp-ht/blob/master/LICENSE)
