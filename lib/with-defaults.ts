import request from './request'

export default function withDefaults (oldEndpoint, newDefaults) {
  const endpoint = oldEndpoint.defaults(newDefaults)
  const newApi = function (route, options) {
    return request(endpoint(route, options))
  }

  newApi.endpoint = endpoint
  newApi.defaults = withDefaults.bind(null, endpoint)
  return newApi
}
