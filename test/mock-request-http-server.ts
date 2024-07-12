import { createServer, RequestListener } from "node:http";
import { type AddressInfo } from "node:net";
import { once } from "node:stream";

import { endpoint } from "@octokit/endpoint";
import type { RequestInterface } from "@octokit/types";

import withDefaults from "../src/with-defaults.ts";
import defaults from "../src/defaults.ts";

export default async function mockRequestHttpServer(
  requestListener: RequestListener,
  fetch = globalThis.fetch,
): Promise<
  RequestInterface<object> & {
    closeMockServer: () => void;
    baseUrlMockServer: string;
  }
> {
  const server = createServer(requestListener);
  server.listen(0);
  await once(server, "listening");

  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  const request = withDefaults(endpoint, {
    ...defaults,
    baseUrl,
    request: {
      fetch,
    },
  }) as RequestInterface<object> & {
    closeMockServer: () => void;
    baseUrlMockServer: string;
  };

  request.baseUrlMockServer = baseUrl;
  request.closeMockServer = server.close.bind(server);

  return request;
}
