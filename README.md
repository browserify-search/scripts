Browserifiability
=================

## Continuous In Background

* bin/follower.js

## Each Time I want to add data samples to search

* bin/import_test_summary
* re-process all modules, or just update the search info for all modules - do we have a script for that?

## Each Time I want to tweak search params

* bin/update_mapping

## Daily

* bin/aggregate_stats.js ~ 4 seconds
* bin/import_elasticsearch.js ~ 5 minutes

## Monthly

* bin/update_download_counts.js ~ 1 hour