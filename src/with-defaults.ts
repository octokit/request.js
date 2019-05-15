import fetchWrapper from "./fetch-wrapper";

import {
  Endpoint,
  request,
  endpoint,
  AnyResponse,
  Route,
  Parameters,
  Defaults
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
    const endpointOptions = endpoint.merge(<Route>route, parameters);

    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint.parse(endpointOptions));
    }

    return endpointOptions.request.hook(endpointOptions, (options: Defaults) =>
      fetchWrapper(endpoint.parse(options))
    );
  };

  return Object.assign(newApi, {
    endpoint,
    defaults: withDefaults.bind(null, endpoint)
  });
}
