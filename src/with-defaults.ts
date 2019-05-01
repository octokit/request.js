import request from './request'
import { endpoint, Parameters } from '@octokit/endpoint/dist-types/types';

export default function withDefaults (oldEndpoint: endpoint, newDefaults: Parameters) {
  const endpoint = oldEndpoint.defaults(newDefaults)
  const newApi = function (route: string, options: Parameters) {
    return request(endpoint(route, options))
  }

  newApi.endpoint = endpoint
  newApi.defaults = withDefaults.bind(null, endpoint)
  return newApi
}
