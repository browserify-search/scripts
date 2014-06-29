var assert = require('assert')

module.exports = function(info){
  if (
  assert(info['dist-tags'])
  var latestVersion = info['dist-tags'].latest
  var latestInfo = info.versions[latestVersion]

  return {
    name: latestInfo.name,
    description: latestInfo.description,
    keywords: keywords(latestInfo),
    readme: readme(info)
  }

}

function readme(info){
  if ("ERROR: No README data found!" === info.readme) return null
  return info.readme
}

function keywords(info){
  var keywords = info.keywords
  if (!keywords){
    return keywords
  }else if (Array.isArray(keywords)){
    return keywords.join(', ')
  }else{
    return String(keywords)
  }
}