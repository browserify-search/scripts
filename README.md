scripts
=======

These scripts run various processes that make browserify search work. This diagram demonstrates at a high level the data flow of the system.

![Data flow chart](./diagram.png)

Starting with the first column from the left:

* npm - in general we use the npm registry `registry.npmjs.org` for fetching metadata about modules
* npm download counts - an [API](https://github.com/npm/download-counts) provided by npm Inc.
* manual test results - this is data collected by manually testing 399 randomly selected modules on npm. The data file is [test-summary.json](https://github.com/browserify-search/browserifiability/blob/master/test-summary.json). [Read for more background info](https://gist.github.com/airportyh/56a0dcc0205661024d11).

Second column:

* [process module](https://github.com/browserify-search/process-module) - this is a code module that handles processing an npm module. The code does a number of things, including
  * [get module metadata](https://github.com/browserify-search/process-module/blob/master/npm/get_module_info.js)
  * [npm install](https://github.com/browserify-search/process-module/blob/master/test_module/npm_install.js)
  * [browserify bundle](https://github.com/browserify-search/process-module/blob/master/test_module/browserify_bundle.js)
  * get [core deps](https://github.com/browserify-search/core-deps) - get the core node modules a module depends on.
  * [calculate browserifiability](https://github.com/browserify-search/browserifiability) - which represents the probability that an npm module will work with browserify.
  * [get download counts](https://github.com/browserify-search/process-module/blob/master/get_download_count.js)

Third column:

* `modules` - this is a mongodb collection contain one document per module, storing the data gotten from [process-module](https://github.com/browserify-search/process-module)
* `moduleStats` - this is a mongodb collection storing the mean, and variance for the download counts throughout the entire npm registry, calculated via a map reduce command in [aggregate_stats.js](https://github.com/browserify-search/scripts/blob/master/aggregate_stats.js).

Fourth column:

* import ES - this is a [script](https://github.com/browserify-search/scripts/blob/master/bulk_insert_elasticsearch_from_db.js) that takes `modules` and `moduleStats` from the mongodb as input and exports the data into Elastic Search.

Fifth column:

* the elastic search instance provides full text search capability to the search engine

Sixth column:

* [www](https://github.com/browserify-search/www) - implements the module search engine website

## Continuous In Background

* `./follower.js`

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