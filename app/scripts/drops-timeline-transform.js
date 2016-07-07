var dropsTimelineTransform = (function(_) {

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
		      var dates = cityAggs[city]
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