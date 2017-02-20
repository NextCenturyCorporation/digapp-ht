var AD_BAR_CHART_DATA = {
  'aggregations': {
    'dates': {
      'dates': {
        'buckets': [{
          'key': 1445299200000,
          'doc_count': 2,
          'locations': {
            'buckets': [{
              'key': 'Atlanta:Georgia:United States:-84.38798:33.749',
              'doc_count': 1,
              'emails': {
                'buckets': [{
                  'key': 'abc123@gmail.com',
                  'doc_count': 1
                }]
              },
              'phones': {
                'buckets': [{
                  'key': '+1-1234567890',
                  'doc_count': 1
                }]
              },
              'publishers': {
                'buckets': [{
                  'key': 'google.com',
                  'doc_count': 1
                }]
              }
            }, {
              'key': 'Brooklyn:New York:United States:-73.94958:40.6501',
              'doc_count': 1,
              'emails': {
                'buckets': [{
                  'key': 'xyz123@yahoo.com',
                  'doc_count': 1
                }]
              },
              'phones': {
                'buckets': [{
                  'key': '+1-9876543210',
                  'doc_count': 1
                }]
              },
              'publishers': {
                'buckets': [{
                  'key': 'yahoo.com',
                  'doc_count': 1
                }]
              }
            }]
          }
        }]
      }
    }
  }
};
