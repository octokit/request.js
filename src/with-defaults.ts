import fetchWrapper from "./fetch-wrapper";
import {
  EndpointOptions,
  EndpointInterface,
  OctokitResponse,
  Route,
  RequestInterface,
  RequestParameters,
} from "@octokit/types";

export default function withDefaults(
  oldEndpoint: EndpointInterface,
  newDefaults: RequestParameters
): RequestInterface {
  const endpoint = oldEndpoint.defaults(newDefaults);
  const newApi = function (
    route: Route | EndpointOptions,
    parameters?: RequestParameters
  ): Promise<OctokitResponse<any>> {
    const endpointOptions = endpoint.merge(<Route>route, parameters);

    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint.parse(endpointOptions));
    }

    const request = (
      route: Route | EndpointOptions,
      parameters?: RequestParameters
    ) => {
      return fetchWrapper(
        endpoint.parse(endpoint.merge(<Route>route, parameters))
      );
    };

    Object.assign(request, {
      endpoint,
      defaults: withDefaults.bind(null, endpoint),
    });

    return endpointOptions.request.hook(request, endpointOptions);
  };

  return Object.assign(newApi, {
    endpoint,
    defaults: withDefaults.bind(null, endpoint),
  }) as RequestInterface<typeof endpoint.DEFAULTS & typeof newDefaults>;
}
