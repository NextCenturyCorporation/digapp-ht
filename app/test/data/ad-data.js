var AD_DATA = {
  'hits': {
    'hits': [{
      '_score': 1.234,
      '_source': {
        'doc_id': 'FB19C30D81EC27912DC9A3905BDF1BE5484D6697EDA2C5A5BDAFF220887A9965',
        'tld': 'google.com',
        'url': 'http://google.com/abc123',
        'fields': {
          'phone': {
            'strict': [{
              'key': '+1-1234567890',
              'name': '+1-1234567890'
            }],
            'relaxed': [{
              'key': '+1-1234567890',
              'name': '+1-1234567890'
            }, {
              'key': '1112223333',
              'name': '1112223333'
            }, {
              'key': '+1-9999999999',
              'name': '+1-9999999999'
            }]
          },
          'age': {
            'strict': [{
              'key': '24',
              'name': '24'
            }],
            'relaxed': [{
              'key': '24',
              'name': '24'
            }, {
              'key': '35',
              'name': '35'
            }]
          },
          'ethnicity': {
            'strict': [{
              'key': 'hispanic',
              'name': 'hispanic'
            }],
            'relaxed': [{
              'key': 'hispanic',
              'name': 'hispanic'
            }, {
              'key': 'asian',
              'name': 'asian'
            }]
          },
          'city': {
            'strict': [{
              'key': 'Roanoke:Virginia:United States:-79.94143:37.27097',
              'name': 'Roanoke'
            }, {
              'key': 'Atlanta:Georgia:United States:-84.38798:33.749',
              'name': 'Atlanta'
            }, {
              'key': 'Brooklyn:New York:United States:-73.94958:40.6501',
              'name': 'Brooklyn'
            }, {
              'key': 'Houston:Texas:United States:-95.36327:29.76328',
              'name': 'Houston'
            }],
            'relaxed': [{
              'key': 'Roanoke:Virginia:United States:-79.94143:37.27097',
              'name': 'Roanoke'
            }, {
              'key': 'Atlanta:Georgia:United States:-84.38798:33.749',
              'name': 'Atlanta'
            }, {
              'key': 'Brooklyn:New York:United States:-73.94958:40.6501',
              'name': 'Brooklyn'
            }, {
              'key': 'Houston:Texas:United States:-95.36327:29.76328',
              'name': 'Houston'
            }, {
              'key': 'Columbus:Ohio:United States:-82.99879:39.96118',
              'name': 'Columbus'
            }]
          },
          'state': {
            'strict': [{
              'key': 'Virginia',
              'name': 'Virginia'
            }, {
              'key': 'Georgia',
              'name': 'Georgia'
            }, {
              'key': 'New York',
              'name': 'New York'
            }, {
              'key': 'Texas',
              'name': 'Texas'
            }],
            'relaxed': [{
              'key': 'Virginia',
              'name': 'Virginia'
            }, {
              'key': 'Georgia',
              'name': 'Georgia'
            }, {
              'key': 'New York',
              'name': 'New York'
            }, {
              'key': 'Texas',
              'name': 'Texas'
            }, {
              'key': 'Ohio',
              'name': 'Ohio'
            }]
          },
          'country': {
            'strict': [{
              'key': 'United States',
              'name': 'United States'
            }],
            'relaxed': [{
              'key': 'United States',
              'name': 'United States'
            }]
          },
          'eye_color': {
            'strict': [{
              'key': 'brown',
              'name': 'brown'
            }],
            'relaxed': [{
              'key': 'brown',
              'name': 'brown'
            }, {
              'key': 'black',
              'name': 'black'
            }]
          },
          'hair_color': {
            'strict': [{
              'key': 'black',
              'name': 'black'
            }],
            'relaxed': [{
              'key': 'black',
              'name': 'black'
            }]
          },
          'height': {
            'strict': [{
              'key': '157',
              'name': '157'
            }],
            'relaxed': [{
              'key': '157',
              'name': '157'
            }, {
              'key': '155',
              'name': '155'
            }]
          },
          'weight': {
            'strict': [{
              'key': '60',
              'name': '60'
            }],
            'relaxed': [{
              'key': '60',
              'name': '60'
            }, {
              'key': '78',
              'name': '78'
            }]
          },
          'title': {
            'strict': [{
              'name': 'Test Ad'
            }]
          },
          'description': {
            'strict': [{
              'name': 'The quick brown fox jumped over the lazy dog.'
            }]
          },
          'email': {
            'strict': [{
              'key': 'test@gmail.com',
              'name': 'test@gmail.com'
            }],
            'relaxed': [{
              'key': 'test@gmail.com',
              'name': 'test@gmail.com'
            }, {
              'key': 'test@yahoo.com',
              'name': 'test@yahoo.com'
            }]
          },
          'price': {
            'strict': [{
              'key': '180-per-60min',
              'name': '180'
            }, {
              'key': '120-per-30min',
              'name': '120'
            }],
            'relaxed': [{
              'key': '180-per-60min',
              'name': '180'
            }, {
              'key': '120-per-30min',
              'name': '120'
            }, {
              'key': '75-per-15min',
              'name': '75'
            }]
          },
          'name': {
            'strict': [{
              'key': 'bianca',
              'name': 'bianca'
            }],
            'relaxed': [{
              'key': 'bianca',
              'name': 'bianca'
            }, {
              'key': 'sweet',
              'name': 'sweet'
            }]
          },
          'gender': {
            'strict': [{
              'key': 'female',
              'name': 'female'
            }],
            'relaxed': [{
              'key': 'female',
              'name': 'female'
            }]
          },
          'service': {
            'strict': [{
              'key': 'massage',
              'name': 'massage'
            }],
            'relaxed': [{
              'key': 'massage',
              'name': 'massage'
            }, {
              'key': 'deep tissue',
              'name': 'deep tissue'
            }]
          },
          'social_media_id': {
            'strict': [{
              'key': 'twitter username',
              'name': 'twitter username'
            }],
            'relaxed': [{
              'key': 'twitter username',
              'name': 'twitter username'
            }]
          },
          'review_id': {
            'strict': [{
              'key': '123456',
              'name': '123456'
            }],
            'relaxed': [{
              'key': '123456',
              'name': '123456'
            }]
          },
          'posting_date': {
            'strict': [{
              'key': '2017-02-06T00:00:00',
              'name': '2017-02-06T00:00:00'
            }]
          }
        }
      }
    }]
  }
};
