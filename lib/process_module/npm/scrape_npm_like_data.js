module.exports = scrapeNpmLikeData

var cheerio = require('cheerio')

function scrapeNpmLikeData(html){
  return getLikeData(cheerio.load(html))
}

function getLikeData($){
  var downloads = getDownloadCounts($)
  return {
    npmDownloadsLastDay: downloads.day,
    npmDownloadsLastWeek: downloads.week,
    npmDownloadsLastMonth: downloads.month,
    npmDependents: getDependentCount($),
    npmStars: getStarCount($)
  }
}

function getDownloadCounts($){
  var downloadCounts = {}
  $('.downloads tr')
    .each(function(){
      var label = $(this).find('td:last-child').text().match(/downloads in the last (day|week|month)/)[1]

      var count = Number($(this)
        .find('td:first-child').text()
        .replace(' ', ''))

      downloadCounts[label] = count
    })
  downloadCounts.day = downloadCounts.day || 0
  downloadCounts.week = downloadCounts.week || 0
  downloadCounts.month = downloadCounts.month || 0
  return downloadCounts
}

function getDependentCount($){
  var list = getRow($, 'Dependents')
      .find('td a').map(function(){ return $(this).text() })
  return getCountFromList(list)
}

function getStarCount($){
  var list = getRow($, 'Starred by')
      .find('td a').map(function(){ return $(this).text() })
  return getCountFromList(list)
}

function getRow($, str){
  return $('.metadata tr').filter(function(){ return $(this).find('th').text().indexOf(str) === 0})
}

function getCountFromList(list){
  var m
  var count = list.length
  if (count === 0) return 0
  if (m = list[list.length - 1].match(/and\s+([0-9]+)\s+more/)){
    count = count - 1 + Number(m[1])
  }
  return count
}