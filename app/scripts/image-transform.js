/**
 * transform elastic search image query to display format.  See data-model.json
 */

/* globals _ */
/* exported imageTransform */
/* jshint camelcase:false */

/* note lodash should be defined in parent scope. */
var imageTransform = (function(_) {

    /** build image object:
        'image': {
            '_id': 'http://someuri/1234567890'
            'url': 'http://someurl/0987654321'
        }
    */
    function getImage(record) {
        var image = {};
        image._id = _.get(record, 'uri');
        image.url = _.get(record, 'url');
        return image;
    }

    function getImageUrl(record) {
        return _.get(record, 'url');
    }

    return {
        // expected data is from an elasticsearch
        images: function(data) {
            var images = [];

            data.hits.hits.forEach(function(hit) {
                images.push(getImageUrl(hit._source));
            });

            return images;
        }
    };
})(_);
