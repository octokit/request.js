import { isPlainObject } from "./is-plain-object.js";
import { RequestError } from "@octokit/request-error";
import type { EndpointInterface, OctokitResponse } from "@octokit/types";

export default async function fetchWrapper(
  requestOptions: ReturnType<EndpointInterface>,
): Promise<OctokitResponse<any>> {
  const fetch: typeof globalThis.fetch =
    requestOptions.request?.fetch || globalThis.fetch;

  if (!fetch) {
    throw new Error(
      "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
    );
  }

  const log = requestOptions.request?.log || console;
  const parseSuccessResponseBody =
    requestOptions.request?.parseSuccessResponseBody !== false;

  const body =
    isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body)
      ? JSON.stringify(requestOptions.body)
      : requestOptions.body;

  const requestHeaders = Object.fromEntries(
    Object.entries(requestOptions.headers).map(([name, value]) => [
      name,
      String(value),
    ]),
  );

  let fetchResponse: Response;

  try {
    fetchResponse = await fetch(requestOptions.url, {
      method: requestOptions.method,
      body,
      redirect: requestOptions.request?.redirect,
      // Header values must be `string`
      headers: requestHeaders,
      signal: requestOptions.request?.signal,
      // duplex must be set if request.body is ReadableStream or Async Iterables.
      // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
      ...(requestOptions.body && { duplex: "half" }),
    });
    // wrap fetch errors as RequestError if it is not a AbortError
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        (error as RequestError).status = 500;
        throw error;
      }

      message = error.message;

      // undici throws a TypeError for network errors
      // and puts the error message in `error.cause`
      // https://github.com/nodejs/undici/blob/e5c9d703e63cd5ad691b8ce26e3f9a81c598f2e3/lib/fetch/index.js#L227
      if (error.name === "TypeError" && "cause" in error) {
        if (error.cause instanceof Error) {
          message = error.cause.message;
        } else if (typeof error.cause === "string") {
          message = error.cause;
        }
      }
    }

    const requestError = new RequestError(message, 500, {
      request: requestOptions,
    });
    requestError.cause = error;

    throw requestError;
  }

  const status = fetchResponse.status;
  const url = fetchResponse.url;
  const responseHeaders: { [header: string]: string } = {};

  for (const keyAndValue of fetchResponse.headers) {
    responseHeaders[keyAndValue[0]] = keyAndValue[1];
  }

  const octokitResponse: OctokitResponse<any> = {
    url,
    status,
    headers: responseHeaders,
    data: "",
  };

  if ("deprecation" in responseHeaders) {
    const matches =
      responseHeaders.link &&
      responseHeaders.link.match(/<([^>]+)>; rel="deprecation"/);
    const deprecationLink = matches && matches.pop();
    log.warn(
      `[@octokit/request] "${requestOptions.method} ${
        requestOptions.url
      }" is deprecated. It is scheduled to be removed on ${responseHeaders.sunset}${
        deprecationLink ? `. See ${deprecationLink}` : ""
      }`,
    );
  }

  if (status === 204 || status === 205) {
    return octokitResponse;
  }

  // GitHub API returns 200 for HEAD requests
  if (requestOptions.method === "HEAD") {
    if (status < 400) {
      return octokitResponse;
    }

    throw new RequestError(fetchResponse.statusText, status, {
      response: octokitResponse,
      request: requestOptions,
    });
  }

  if (status === 304) {
    octokitResponse.data = await getResponseData(fetchResponse);

    throw new RequestError("Not modified", status, {
      response: octokitResponse,
      request: requestOptions,
    });
  }

  if (status >= 400) {
    octokitResponse.data = await getResponseData(fetchResponse);

    const error = new RequestError(
      toErrorMessage(octokitResponse.data),
      status,
      {
        response: octokitResponse,
        request: requestOptions,
      },
    );

    throw error;
  }

  const responseBody = parseSuccessResponseBody
    ? await getResponseData(fetchResponse)
    : fetchResponse.body;

  return {
    status,
    url,
    headers: responseHeaders,
    data: responseBody,
  };
}

async function getResponseData(response: Response) {
  const contentType = response.headers.get("content-type");
  if (/application\/json/.test(contentType!)) {
    return (
      response
        .json()
        // In the event that we get an empty response body we fallback to
        // using .text(), but this should be investigated since if this were
        // to occur in the GitHub API it really should not return an empty body.
        .catch(() => response.text())
        // `node-fetch` is throwing a "body used already for" error if `.text()` is run
        // after a failed .json(). To account for that we fallback to an empty string
        .catch(() => "")
    );
  }

  if (
    (!contentType || /^text\/|charset=utf-8$/.test(contentType)) &&
    response.text
  ) {
    return response.text();
  }

  return response.arrayBuffer();
}

function toErrorMessage(data: any) {
  if (typeof data === "string") return data;

  let suffix: string;

  if ("documentation_url" in data) {
    suffix = ` - ${data.documentation_url}`;
  } else {
    suffix = "";
  }

  if ("message" in data) {
    if (Array.isArray(data.errors)) {
      return `${data.message}: ${data.errors.map(JSON.stringify).join(", ")}${suffix}`;
    }

    return `${data.message}${suffix}`;
  }

  return `Unknown error: ${JSON.stringify(data)}`;
}
