import { isPlainObject } from "./is-plain-object.js";
import { RequestError } from "@octokit/request-error";
import type { EndpointInterface } from "@octokit/types";

export default function fetchWrapper(
  requestOptions: ReturnType<EndpointInterface>,
) {
  const log =
    requestOptions.request && requestOptions.request.log
      ? requestOptions.request.log
      : console;
  const parseSuccessResponseBody =
    requestOptions.request?.parseSuccessResponseBody !== false;

  if (
    isPlainObject(requestOptions.body) ||
    Array.isArray(requestOptions.body)
  ) {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  let headers: { [header: string]: string } = {};
  let status: number;
  let url: string;

  const fetch: typeof globalThis.fetch =
    requestOptions.request?.fetch || globalThis.fetch;

  if (!fetch) {
    throw new Error(
      "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
    );
  }

  return fetch(requestOptions.url, {
    method: requestOptions.method,
    body: requestOptions.body,
    redirect: requestOptions.request?.redirect,
    // Header values must be `string`
    headers: Object.fromEntries(
      Object.entries(requestOptions.headers).map(([name, value]) => [
        name,
        String(value),
      ]),
    ),
    signal: requestOptions.request?.signal,
    // duplex must be set if request.body is ReadableStream or Async Iterables.
    // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
    ...(requestOptions.body && { duplex: "half" }),
  })
    .then(async (response) => {
      url = response.url;
      status = response.status;

      for (const keyAndValue of response.headers) {
        headers[keyAndValue[0]] = keyAndValue[1];
      }

      if ("deprecation" in headers) {
        const matches =
          headers.link && headers.link.match(/<([^>]+)>; rel="deprecation"/);
        const deprecationLink = matches && matches.pop();
        log.warn(
          `[@octokit/request] "${requestOptions.method} ${
            requestOptions.url
          }" is deprecated. It is scheduled to be removed on ${headers.sunset}${
            deprecationLink ? `. See ${deprecationLink}` : ""
          }`,
        );
      }

      if (status === 204 || status === 205) {
        return;
      }

      // GitHub API returns 200 for HEAD requests
      if (requestOptions.method === "HEAD") {
        if (status < 400) {
          return;
        }

        throw new RequestError(response.statusText, status, {
          response: {
            url,
            status,
            headers,
            data: undefined,
          },
          request: requestOptions,
        });
      }

      if (status === 304) {
        throw new RequestError("Not modified", status, {
          response: {
            url,
            status,
            headers,
            data: await getResponseData(response),
          },
          request: requestOptions,
        });
      }

      if (status >= 400) {
        const data = await getResponseData(response);

        const error = new RequestError(toErrorMessage(data), status, {
          response: {
            url,
            status,
            headers,
            data,
          },
          request: requestOptions,
        });

        throw error;
      }

      return parseSuccessResponseBody
        ? await getResponseData(response)
        : response.body;
    })
    .then((data) => {
      return {
        status,
        url,
        headers,
        data,
      };
    })
    .catch((error) => {
      if (error instanceof RequestError) throw error;
      else if (error.name === "AbortError") throw error;

      let message = error.message;

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

      throw new RequestError(message, 500, {
        request: requestOptions,
      });
    });
}

const applicationJsonRE = /^application\/json\b/;
const textUtf8RE = /^text\/|(\b)+charset=utf-8$/;

function getResponseData(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");

  if (!contentType) {
    return response.text();
  } else if (applicationJsonRE.test(contentType)) {
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
  } else if (textUtf8RE.test(contentType)) {
    return response.text();
  } else {
    return response.arrayBuffer();
  }
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
