const endpoint = require('@octokit/endpoint')
const fetch = require('node-fetch').default
const getUserAgent = require('universal-user-agent')

const request = require('./lib/request')
const version = require('./package.json').version
const userAgent = `octokit-request.js/${version} ${getUserAgent()}`

function octokitRequest (endpoint, route, options) {
  return request(module.exports.fetch, endpoint(route, options))
}

function withDefaults (oldEndpoint, newDefaults) {
  const endpoint = oldEndpoint.defaults(newDefaults)
  const request = octokitRequest.bind(null, endpoint)
  request.endpoint = endpoint
  request.defaults = withDefaults.bind(null, endpoint)
  return request
}

module.exports = withDefaults(endpoint, {
  headers: {
    'user-agent': userAgent
  }
})

// expose internally used `fetch` method for testing/mocking only
module.exports.fetch = fetch
