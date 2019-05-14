import fetchWrapper from "./fetch-wrapper";

import {
  Endpoint,
  request,
  endpoint,
  AnyResponse,
  Route,
  Parameters
} from "./types";

export default function withDefaults(
  oldEndpoint: endpoint,
  newDefaults: Parameters
): request {
  const endpoint = oldEndpoint.defaults(newDefaults);
  const newApi = function(
    route: Route | Endpoint,
    parameters?: Parameters
  ): Promise<AnyResponse> {
    return fetchWrapper(endpoint(<Route>route, parameters));
  };

  return Object.assign(newApi, {
    endpoint,
    defaults: withDefaults.bind(null, endpoint)
  });
}
