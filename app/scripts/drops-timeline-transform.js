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

		    /* Aggregate cities */
		    var cityBuckets = data.aggregations.phone.city.buckets;
		    var cityAggs = {};

		    for (var i in cityBuckets) {
		      var bucket = cityBuckets[i];
		      var city = bucket.key;

		      /* Assign city Aggregations */
		      if (!(city in cityAggs))
		        cityAggs[city] = [];

		      for (var t in bucket.timeline.buckets) {
		        var timelineBucket = bucket.timeline.buckets[t];

		        if (timelineBucket.key) {
		          cityAggs[city].push(new Date(timelineBucket.key));
		          timestamps.push(timelineBucket.key);
		        }
		      }                   
		    }		    

		    /* Transform data */
		    for (var city in cityAggs) {
		      var dates = offsetDates(cityAggs[city]);

		      transformedData.push({
		        name: city.split(':')[0],
		        data: dates 
		      });
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