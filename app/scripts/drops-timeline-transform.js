var dropsTimelineTransform = (function(_) {

	var offsetDates = function (dates) {
		var sorted = _.sortBy(dates);
		for( var i=1; i < sorted.length; i++ ){
			if (sorted[i] == sorted[i-1])
				sorted[i] = new Date(sorted[i].getTime() + 300);
		}

		return sorted;		
	};

	return {
		timeline : function(data) {			

			var timestamps = [];
			var transformedData = [];

      if(data && data.aggregations) {

		    /* Aggregate cities */
		    var cityAggs = {};

		    data.aggregations.locations.locations.buckets.forEach(function(locationBucket) {
		      var city = locationBucket.key;

		      /* Assign city Aggregations */
		      if (!(city in cityAggs))
		        cityAggs[city] = [];

          locationBucket.dates.buckets.forEach(function(dateBucket) {
		        if (dateBucket.key) {
		          cityAggs[city].push(new Date(dateBucket.key));
		          timestamps.push(dateBucket.key);
		        }
		      });
        });

		    /* Transform data */
		    for (var city in cityAggs) {
		      var dates = offsetDates(cityAggs[city]);

		      transformedData.push({
		        name: city.split(':')[0],
		        data: dates 
		      });
		    }  
      }
		  
		  return {
		  	data: transformedData,
		  	timestamps: timestamps
		  }
		},
		extractPhonesFromWebpageDisplayData : function(data) {			
			return _.map(data.phones, '_id');			
		}
	}	

})(_);
