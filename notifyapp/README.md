# notifyapp

This application runs DIG saved queries at specified intervals, checks the query results for new items, triggers alerts if new items are found, and sends emails to alert users.

# environment variables

Name                      | Description
------------------------- | -----------------------------------------------------------------------
LOG_NAME                  | Name for the logger (DIG Alerts App)
LOG_PATH                  | File path for the logger (/var/log/dig_alerts_app.log)
MAILER_EMAIL_ADDRESS      | Address from which emails are sent (digapp@nextcentury.com)
DIG_SUPPORT_EMAIL_ADDRESS | Address to which support emails are sent (no default)
DIG_URL                   | Application URL for the alert emails (no default)
ES_AUTH                   | Authentication for the elasticsearch client (null by default)
ES_HOST                   | Host for the elasticsearch client (localhost)
ES_PORT                   | Port for the elasticsearch client (9200)
ES_PROTOCOL               | Protocol for the elasticsearch client (http)
USER_INDEX                | Elasticsearch user index (dig-users)
USER_TYPE                 | Elasticsearch user index type (users)
DATA_INDEX                | Elasticsearch data index (dig-latest)
DATE_FIELD                | Date field in the data index on which to sort (dateCreated)

