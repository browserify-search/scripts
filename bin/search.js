#! /usr/bin/env node

var request = require('superagent')
var cmdLn = require('cmd-ln')
require('colors')
var config = require('../config.json')

cmdLn(function(query){
  request
    .get(config.elastic_search + '/browserify-search/module/_search')
    .send(JSON.stringify({
      from: 0,
      size: 50,
      query: {
        function_score: {
          score_mode: 'multiply',
          boost_mode: 'multiply',
          query: {
            multi_match: {
              query: query,
              fields: [
                'search.name',
                'search.keywords',
                'search.description',
                'search.readme'
              ]
            }
          },
          functions: [
            {
              script_score: {
                script: "doc['browserifiability'].value"
              }
            },
            {
              script_score: {
                script: "pow(doc['downloadsLastMonth.cdf'].value, 1.5)"
              }
            }
          ]
        }
      }
    }))
    .end(function(err, reply){
      if (err) return console.error(err.message)
      var results = reply.body
      if (results.error){
        console.log(results.error)
        return
      }
      /*
      var hits = results.hits.hits.map(function(m){return m._source})
      console.log(hits.length, 'hits')
      hits.forEach(function(module){
        console.log(
          module.search.name)
        console.log('  ',
          module.browserifiability, 
          module.search.description)
      })*/
      results.hits.hits.forEach(function(hit, i){
        var module = hit._source
        var score = hit._score
        console.log(
          (i + 1) + '.', module.search.name, '-',
          score.toFixed(2), 
          module.downloadsLastMonth.cdf.toFixed(2),
          module.browserifiability.toFixed(2), 
          module.search.description)
      })
      //console.log(results.hits.hits)
    })
})