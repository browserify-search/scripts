Browserifiability
=================

## Continuous In Background

* bin/follower.js

## Each Time I want to add data samples to search learning algorithm

* bin/import_test_summary
* re-process all modules, or just update the search info for all modules - do we have a script for that?

## Each Time I want to tweak search params

* bin/update_mapping
* re import data into Elastic Search

## Daily

* bin/aggregate_stats.js ~ 4 seconds
* bin/import_elasticsearch.js ~ 5 minutes

## Monthly

* bin/update_download_counts.js ~ 1 hour

## Data Snapshots

* <https://www.dropbox.com/sh/5cqeb8xj4z35w6l/AAAp5QSiQT00b_KergLyowkma?dl=0>

Make sure you have the following settings in `elasticsearch.yml`:

```
http.max_content_length: 1000mb
script.disable_dynamic: false
```

To import 

```
bin/bulk_insert_elasticsearch.js ~/Dropbox/browserify-search/modules.json ~/Dropbox/browserify-search/moduleStats.json | curl -s -XPOST localhost:9200/browserify-search/module/_bulk --data-binary @-
```

```
bin/bulk_insert_elasticsearch_from_db.js | curl -s -XPOST localhost:9200/browserify-search/module/_bulk --data-binary @-
```