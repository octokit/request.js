import { describe, it, expect } from "vitest";

import { request } from "../src/index.ts";

describe("request()", () => {
  it("is a function", () => {
    expect(request).toBeInstanceOf(Function);
  });

  it("Request error", async () => {
    expect.assertions(1);

    // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
    await expect(request("GET https://127.0.0.1:8/")).rejects.toHaveProperty(
      "status",
      500,
    );
  });

  it("Resolves with url", async () => {
    expect.assertions(1);

    // this test cannot be mocked with `fetch-mock`. I don’t like to rely on
    // external websites to run tests, but in this case I’ll make an exception.
    // The alternative would be to start a local server we then send a request to,
    // this would only work in Node, so we would need to adapt the test setup, too.
    // We also can’t test the GitHub API, because on Travis unauthenticated
    // GitHub API requests are usually blocked due to IP rate limiting
    const response = await request(
      "https://www.githubstatus.com/api/v2/status.json",
    );
    expect(response.url).toEqual(
      "https://www.githubstatus.com/api/v2/status.json",
    );
  }, 10000);

  it("request should pass the `redirect` option to fetch", () => {
    expect.assertions(1);

    const customFetch = async (url: string, options: RequestInit) => {
      expect(options.redirect).toEqual("manual");
      return await fetch(url, options);
    };

    return request("/", {
      request: {
        redirect: "manual",
        fetch: customFetch,
      },
    });
  });

  it("options.request.fetch", async () => {
    expect.assertions(1);

    const response = await request("/", {
      request: {
        fetch: () =>
          Promise.resolve({
            status: 200,
            headers: new Headers({
              "Content-Type": "application/json; charset=utf-8",
            }),
            url: "http://api.github.com/",
            json() {
              return Promise.resolve("funk");
            },
            text() {
              return Promise.resolve("funk");
            },
          }),
      },
    });
    expect(response.data).toEqual("funk");
  });

  it("Request TypeError error with an Error cause", async () => {
    expect.assertions(2);

    try {
      // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      await request("GET https://127.0.0.1:8/", {
        request: {
          fetch: () =>
            Promise.reject(
              Object.assign(new TypeError("fetch failed"), {
                cause: new Error("bad"),
              }),
            ),
        },
      });
      throw new Error("should not resolve");
    } catch (error: any) {
      expect(error.status).toEqual(500);
      expect(error.message).toEqual("bad");
    }
  });

  it("Request TypeError error with a string cause", async () => {
    expect.assertions(2);

    try {
      // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      await request("GET https://127.0.0.1:8/", {
        request: {
          fetch: () =>
            Promise.reject(
              Object.assign(new TypeError("fetch failed"), {
                cause: "bad",
              }),
            ),
        },
      });
      throw new Error("should not resolve");
    } catch (error: any) {
      expect(error.status).toEqual(500);
      expect(error.message).toEqual("bad");
    }
  });
});
