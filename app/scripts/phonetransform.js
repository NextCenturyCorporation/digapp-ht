/* globals _ */
var phonetransform = (function() {

    function getTelephone(record) {
        /** build telephone object:
        "telephone": {
        "number": "1234567890",
        "type": "cell",
        "origin": "Washington, DC"
        }
        */
        var telephone = {};
        telephone.number = _.get(record, 'seller.telephone[0].name[0]');
        telephone.type = 'cell';
        telephone.origin = 'Washington, DC';
        return telephone;
    }

    return {
        // expected data is from an elasticsearch 
        transform: function(data) {

            data.telephone = getTelephone(data.hits.hits[0]._source);
            return data;
        }
    };

})();

// function phonetransform(data) {
//     var newData = [];
//     data.forEach(function(record) {
//         var data = record._source;

//         var phone = {};
//         phone.telephone = getTelephone(data);
//     });
//     newData.push(data);
//     return newData;
// }


