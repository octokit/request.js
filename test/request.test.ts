import zlib from "node:zlib";
import fs from "node:fs";
import stream from "node:stream";
import { ReadableStream } from "node:stream/web";

import { describe, it, expect, vi } from "vitest";
import { getUserAgent } from "universal-user-agent";
import fetchMock, { FetchMock } from "fetch-mock";
import { createAppAuth } from "@octokit/auth-app";
import type {
  EndpointOptions,
  RequestInterface,
  ResponseHeaders,
} from "@octokit/types";

import { request } from "../src/index.ts";

const userAgent = `octokit-request.js/0.0.0-development ${getUserAgent()}`;
const __filename = new URL(import.meta.url);
function stringToArrayBuffer(str: string) {
  return new TextEncoder().encode(str).buffer;
}

describe("request()", () => {
  it("Test ReDoS - attack string", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      const response = await originalFetch(url, options);
      const fakeHeaders = new Headers(response.headers);
      fakeHeaders.set("link", "<".repeat(100000) + ">");
      fakeHeaders.set("deprecation", "true");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: fakeHeaders
      });
    };
    const startTime = performance.now();
    request("GET /repos/octocat/hello-world");
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    const reDosThreshold = 2000; 
    expect(elapsedTime).toBeLessThanOrEqual(reDosThreshold);
    if (elapsedTime > reDosThreshold) {
      console.warn(`🚨 Potential ReDoS Attack! getDuration method took ${elapsedTime.toFixed(2)} ms, exceeding threshold of ${reDosThreshold} ms.`);
    }
  });

  it("is a function", () => {
    expect(request).toBeInstanceOf(Function);
  });

  it("README example", async () => {
    expect.assertions(1);
    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/orgs/octokit/repos?type=private", [], {
      headers: {
        accept: "application/vnd.github.v3+json",
        authorization: "token 0000000000000000000000000000000000000001",
        "user-agent": userAgent,
      },
    });

    const response = await request("GET /orgs/{org}/repos", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      org: "octokit",
      type: "private",
      request: {
        fetch: mock.fetchHandler,
      },
    });
    expect(response.data).toEqual([]);
  });

  it("README example alternative", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/orgs/octokit/repos?type=private", []);

    const response = await request({
      method: "GET",
      url: "/orgs/{org}/repos",
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      org: "octokit",
      type: "private",
      request: {
        fetch: mock.fetchHandler,
      },
    });
    expect(response.data).toEqual([]);
  });

  it("README authentication example", async () => {
    expect.assertions(1);

    vi.useFakeTimers({
      now: 0,
      toFake: ["Date"],
    });
    const APP_ID = 1;
    const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1c7+9z5Pad7OejecsQ0bu3aozN3tihPmljnnudb9G3HECdnH
lWu2/a1gB9JW5TBQ+AVpum9Okx7KfqkfBKL9mcHgSL0yWMdjMfNOqNtrQqKlN4kE
p6RD++7sGbzbfZ9arwrlD/HSDAWGdGGJTSOBM6pHehyLmSC3DJoR/CTu0vTGTWXQ
rO64Z8tyXQPtVPb/YXrcUhbBp8i72b9Xky0fD6PkEebOy0Ip58XVAn2UPNlNOSPS
ye+Qjtius0Md4Nie4+X8kwVI2Qjk3dSm0sw/720KJkdVDmrayeljtKBx6AtNQsSX
gzQbeMmiqFFkwrG1+zx6E7H7jqIQ9B6bvWKXGwIDAQABAoIBAD8kBBPL6PPhAqUB
K1r1/gycfDkUCQRP4DbZHt+458JlFHm8QL6VstKzkrp8mYDRhffY0WJnYJL98tr4
4tohsDbqFGwmw2mIaHjl24LuWXyyP4xpAGDpl9IcusjXBxLQLp2m4AKXbWpzb0OL
Ulrfc1ZooPck2uz7xlMIZOtLlOPjLz2DuejVe24JcwwHzrQWKOfA11R/9e50DVse
hnSH/w46Q763y4I0E3BIoUMsolEKzh2ydAAyzkgabGQBUuamZotNfvJoDXeCi1LD
8yNCWyTlYpJZJDDXooBU5EAsCvhN1sSRoaXWrlMSDB7r/E+aQyKua4KONqvmoJuC
21vSKeECgYEA7yW6wBkVoNhgXnk8XSZv3W+Q0xtdVpidJeNGBWnczlZrummt4xw3
xs6zV+rGUDy59yDkKwBKjMMa42Mni7T9Fx8+EKUuhVK3PVQyajoyQqFwT1GORJNz
c/eYQ6VYOCSC8OyZmsBM2p+0D4FF2/abwSPMmy0NgyFLCUFVc3OECpkCgYEA5OAm
I3wt5s+clg18qS7BKR2DuOFWrzNVcHYXhjx8vOSWV033Oy3yvdUBAhu9A1LUqpwy
Ma+unIgxmvmUMQEdyHQMcgBsVs10dR/g2xGjMLcwj6kn+xr3JVIZnbRT50YuPhf+
ns1ScdhP6upo9I0/sRsIuN96Gb65JJx94gQ4k9MCgYBO5V6gA2aMQvZAFLUicgzT
u/vGea+oYv7tQfaW0J8E/6PYwwaX93Y7Q3QNXCoCzJX5fsNnoFf36mIThGHGiHY6
y5bZPPWFDI3hUMa1Hu/35XS85kYOP6sGJjf4kTLyirEcNKJUWH7CXY+00cwvTkOC
S4Iz64Aas8AilIhRZ1m3eQKBgQCUW1s9azQRxgeZGFrzC3R340LL530aCeta/6FW
CQVOJ9nv84DLYohTVqvVowdNDTb+9Epw/JDxtDJ7Y0YU0cVtdxPOHcocJgdUGHrX
ZcJjRIt8w8g/s4X6MhKasBYm9s3owALzCuJjGzUKcDHiO2DKu1xXAb0SzRcTzUCn
7daCswKBgQDOYPZ2JGmhibqKjjLFm0qzpcQ6RPvPK1/7g0NInmjPMebP0K6eSPx0
9/49J6WTD++EajN7FhktUSYxukdWaCocAQJTDNYP0K88G4rtC2IYy5JFn9SWz5oh
x//0u+zd/R/QRUzLOw4N72/Hu+UG6MNt5iDZFCtapRaKt6OvSBwy8w==
-----END RSA PRIVATE KEY-----`;
    // see https://runkit.com/gr2m/reproducable-jwt
    const BEARER =
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOi0zMCwiZXhwIjo1NzAsImlzcyI6MX0.q3foRa78U3WegM5PrWLEh5N0bH1SD62OqW66ZYzArp95JBNiCbo8KAlGtiRENCIfBZT9ibDUWy82cI4g3F09mdTq3bD1xLavIfmTksIQCz5EymTWR5v6gL14LSmQdWY9lSqkgUG0XCFljWUglEP39H4yeHbFgdjvAYg3ifDS12z9oQz2ACdSpvxPiTuCC804HkPVw8Qoy0OSXvCkFU70l7VXCVUxnuhHnk8-oCGcKUspmeP6UdDnXk-Aus-eGwDfJbU2WritxxaXw6B4a3flTPojkYLSkPBr6Pi0H2-mBsW_Nvs0aLPVLKobQd4gqTkosX3967DoAG8luUMhrnxe8Q";
    const mock = fetchMock.createInstance();
    mock
      .postOnce("https://api.github.com/app/installations/123/access_tokens", {
        token: "secret123",
        expires_at: "1970-01-01T01:00:00.000Z",
        permissions: {
          metadata: "read",
        },
        repository_selection: "all",
      })
      .getOnce(
        "https://api.github.com/app",
        { id: 123 },
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": userAgent,
            authorization: `bearer ${BEARER}`,
          },
        },
      )
      .postOnce(
        "https://api.github.com/repos/octocat/hello-world/issues",
        { id: 456 },
        {
          headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": userAgent,
            authorization: `token secret123`,
          },
        },
      );
    const auth = createAppAuth({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId: 123,
    });
    const requestWithAuth = request.defaults({
      request: {
        fetch: mock.fetchHandler,
        hook: auth.hook,
      },
    });
    await requestWithAuth("GET /app");
    await requestWithAuth("POST /repos/{owner}/{repo}/issues", {
      owner: "octocat",
      repo: "hello-world",
      title: "Hello from the engine room",
    });

    expect(mock.callHistory.done()).toBe(true);
    vi.useRealTimers();
  });

  it("Request with body", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.post("https://api.github.com/repos/octocat/hello-world/issues", 201, {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });

    const response = await request("POST /repos/{owner}/{repo}/issues", {
      owner: "octocat",
      repo: "hello-world",
      headers: {
        accept: "text/html;charset=utf-8",
      },
      title: "Found a bug",
      body: "I'm having a problem with this.",
      assignees: ["octocat"],
      milestone: 1,
      labels: ["bug"],
      request: {
        fetch: mock.fetchHandler,
      },
    });

    expect(response.status).toEqual(201);
  });

  it("Put without request body", async () => {
    const mock = fetchMock.createInstance();

    mock.put("https://api.github.com/user/starred/octocat/hello-world", {
      status: 204,
    });

    // Perform the request
    const response = await request("PUT /user/starred/{owner}/{repo}", {
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`,
      },
      owner: "octocat",
      repo: "hello-world",
      request: {
        fetch: mock.fetchHandler,
      },
    });

    expect(response.status).toEqual(204);
  });

  it("HEAD requests (octokit/rest.js#841)", async () => {
    expect.assertions(2);

    const mock = fetchMock.createInstance();
    mock
      .head("https://api.github.com/repos/whatwg/html/pulls/1", {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": "19137",
        },
      })
      .head("https://api.github.com/repos/whatwg/html/pulls/2", {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": "120",
        },
      });

    const options = {
      owner: "whatwg",
      repo: "html",
      number: 1,
      request: {
        fetch: mock.fetchHandler,
      },
    };

    const response = await request(
      `HEAD /repos/{owner}/{repo}/pulls/{number}`,
      options,
    );
    expect(response.status).toEqual(200);

    await expect(
      request(
        `HEAD /repos/{owner}/{repo}/pulls/{number}`,
        Object.assign(options, { number: 2 }),
      ),
    ).rejects.toHaveProperty("status", 404);
  });

  it.skip("Binary response with redirect (🤔 unclear how to mock fetch redirect properly)", async () => {
    const mock = fetchMock.createInstance();
    mock
      .get(
        "https://codeload.github.com/repos/octokit-fixture-org/get-archive-1/tarball/master",
        {
          status: 301,
          headers: {
            location:
              "https://codeload.github.com/repos/octokit-fixture-org/get-archive-2/tarball/master",
          },
        },
      )
      .get(
        "https://codeload.github.com/repos/octokit-fixture-org/get-archive-2/tarball/master",
        {
          status: 200,
          body: Buffer.from(
            "1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000",
            "hex",
          ),
          headers: {
            "content-type": "application/x-gzip",
            "content-length": "172",
          },
        },
      );

    const response = await request(
      "GET https://codeload.github.com/repos/{owner}/{repo}/{archive_format}/{ref}",
      {
        owner: "octokit-fixture-org",
        repo: "get-archive-1",
        archive_format: "tarball",
        ref: "master",
        request: {
          fetch: mock.fetchHandler,
        },
      },
    );
    expect(response.status).toEqual(200);
    expect(response.data.length).toEqual(172);
  });

  it("Binary response", async () => {
    expect.assertions(5);

    const payload =
      "1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000";
    const mock = fetchMock.createInstance();
    mock.get(
      "https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master",
      {
        status: 200,

        // expect(response.data.length).toEqual(172)
        // body: Buffer.from('1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000', 'hex'),
        body: Buffer.from(
          "1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000",
          "hex",
        ),
        headers: {
          "content-type": "application/x-gzip",
          "content-length": "172",
        },
      },
    );

    const response = await request(
      "GET https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master",
      {
        request: {
          fetch: mock.fetchHandler,
        },
      },
    );

    expect(response.headers["content-type"]).toEqual("application/x-gzip");
    expect(response.headers["content-length"]).toEqual("172");
    expect(response.status).toEqual(200);
    expect(response.data).toBeInstanceOf(ArrayBuffer);
    expect(zlib.gunzipSync(Buffer.from(payload, "hex")).buffer).toEqual(
      response.data,
    );
  });

  it("304 etag", async () => {
    expect.assertions(1);
    const mock = fetchMock.createInstance();

    mock.get("https://api.github.com/orgs/myorg", {
      status: 304,
      headers: {
        "If-None-Match": "etag",
      },
    });

    await expect(
      request("GET /orgs/{org}", {
        org: "myorg",
        headers: { "If-None-Match": "etag" },
        request: {
          fetch: mock.fetchHandler,
        },
      }),
    ).rejects.toHaveProperty("status", 304);
  });

  it("304 last-modified", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/orgs/myorg", {
      status: 304,
      headers: {
        "if-modified-since": "Sun Dec 24 2017 22:00:00 GMT-0600 (CST)",
      },
    });

    await expect(
      request("GET /orgs/{org}", {
        org: "myorg",
        headers: {
          "If-Modified-Since": "Sun Dec 24 2017 22:00:00 GMT-0600 (CST)",
        },
        request: {
          fetch: mock.fetchHandler,
        },
      }),
    ).rejects.toHaveProperty("status", 304);
  });

  it("Not found", async () => {
    expect.assertions(3);

    const mock = fetchMock.createInstance();
    mock.get("path:/orgs/nope", 404);

    try {
      await request("GET /orgs/{org}", {
        org: "nope",
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.status).toEqual(404);
      expect(error.request.method).toEqual("GET");
      expect(error.request.url).toEqual("https://api.github.com/orgs/nope");
    }
  });

  it("should error when globalThis.fetch is undefined", async () => {
    expect.assertions(1);

    const originalFetch = globalThis.fetch;
    // @ts-expect-error force undefined to mimic older node version
    globalThis.fetch = undefined;

    try {
      await request("GET /orgs/me");
    } catch (error) {
      expect(error.message).toEqual(
        "fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("error response with no body (octokit/request.js#649)", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("path:/repos/octokit-fixture-org/hello-world/contents/README.md", {
      status: 500,
      body: "",
      headers: {
        "content-type": "application/json",
      },
    });

    try {
      await request("GET /repos/{owner}/{repo}/contents/{path}", {
        headers: {
          accept: "content-type: application/json",
        },
        owner: "octokit-fixture-org",
        repo: "hello-world",
        path: "README.md",
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.response.data).toBe("");
    }
  });

  it("non-JSON response", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("path:/repos/octokit-fixture-org/hello-world/contents/README.md", {
      status: 200,
      body: "# hello-world",
      headers: {
        "content-length": "13",
        "content-type": "application/vnd.github.v3.raw; charset=utf-8",
      },
    });

    const response = await request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        headers: {
          accept: "application/vnd.github.v3.raw",
        },
        owner: "octokit-fixture-org",
        repo: "hello-world",
        path: "README.md",
        request: {
          fetch: mock.fetchHandler,
        },
      },
    );
    expect(response.data).toEqual("# hello-world");
  });

  it("Request error", async () => {
    expect.assertions(1);

    // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
    await expect(request("GET https://127.0.0.1:8/")).rejects.toHaveProperty(
      "status",
      500,
    );
  });

  it("Request TypeError error with an Error cause", async () => {
    expect.assertions(2);

    const mock = fetchMock.createInstance();
    mock.get("https://127.0.0.1:8/", {
      throws: Object.assign(new TypeError("fetch failed"), {
        cause: new Error("bad"),
      }),
    });

    try {
      // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      await request("GET https://127.0.0.1:8/", {
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.status).toEqual(500);
      expect(error.message).toEqual("bad");
    }
  });

  it("Request TypeError error with a string cause", async () => {
    expect.assertions(2);

    const mock = fetchMock.createInstance();
    mock.get("https://127.0.0.1:8/", {
      throws: Object.assign(new TypeError("fetch failed"), { cause: "bad" }),
    });

    try {
      // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
      await request("GET https://127.0.0.1:8/", {
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.status).toEqual(500);
      expect(error.message).toEqual("bad");
    }
  });

  it("custom user-agent", async () => {
    expect.assertions(2);
    const mock = fetchMock.createInstance();

    mock.get("https://api.github.com/orgs/myorg", {
      status: 200,
      headers: {
        "user-agent": "funky boom boom pow",
      },
    });

    const response = await request("GET /orgs/{owner}", {
      headers: {
        "user-agent": "funky boom boom pow",
      },
      owner: "myorg",
      request: {
        fetch: mock.fetchHandler,
      },
    });

    expect(response.status).toEqual(200);
    expect(mock.callHistory.calls()[0].options.headers!["user-agent"]).toEqual(
      "funky boom boom pow",
    );
  });

  it("422 error with details", async () => {
    expect.assertions(4);

    const mock = fetchMock.createInstance();
    mock.post("https://api.github.com/repos/octocat/hello-world/labels", {
      status: 422,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Foo": "bar",
      },
      body: {
        message: "Validation Failed",
        errors: [
          {
            resource: "Label",
            code: "invalid",
            field: "color",
          },
        ],
        documentation_url:
          "https://developer.github.com/v3/issues/labels/#create-a-label",
      },
    });

    try {
      await request("POST /repos/octocat/hello-world/labels", {
        name: "foo",
        color: "invalid",
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.status).toEqual(422);
      expect(error.response.headers["x-foo"]).toEqual("bar");
      expect(error.response.data.documentation_url).toEqual(
        "https://developer.github.com/v3/issues/labels/#create-a-label",
      );
      expect(error.response.data.errors).toEqual([
        { resource: "Label", code: "invalid", field: "color" },
      ]);
    }
  });

  it("redacts credentials from error.request.headers.authorization", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/", {
      status: 500,
    });

    try {
      await request("/", {
        headers: {
          authorization: "token secret123",
        },
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.request.headers.authorization).toEqual("token [REDACTED]");
    }
  });

  it("redacts credentials from error.request.url", async () => {
    expect.assertions(1);
    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/?client_id=123&client_secret=secret123", {
      status: 500,
    });

    try {
      await request("/", {
        client_id: "123",
        client_secret: "secret123",
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.request.url).toMatch(
        /\?client_id=123&client_secret=\[REDACTED\]$/,
      );
    }
  });

  it("Just URL", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("path:/", 200);

    const response = await request("/", {
      request: {
        fetch: mock.fetchHandler,
      },
    });

    expect(response.status).toEqual(200);
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

  it("options.request.hook", async () => {
    expect.assertions(4);

    const mock = fetchMock.createInstance();
    mock.get(
      "https://api.github.com/foo",
      { ok: true },
      {
        headers: {
          "x-foo": "bar",
        },
      },
    );

    const hook = (request: RequestInterface, options: EndpointOptions) => {
      expect(request.endpoint).toBeInstanceOf(Function);
      expect(request.defaults).toBeInstanceOf(Function);
      expect(options).toEqual({
        baseUrl: "https://api.github.com",
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": userAgent,
        },
        mediaType: {
          format: "",
        },
        method: "GET",
        request: {
          fetch: mock.fetchHandler,
          hook,
        },
        url: "/",
      });

      return request("/foo", {
        headers: {
          "x-foo": "bar",
        },
        request: {
          fetch: mock.fetchHandler,
        },
      });
    };

    const response = await request("/", {
      request: {
        fetch: mock.fetchHandler,
        hook,
      },
    });
    expect(response.data).toEqual({ ok: true });
  });

  it("options.mediaType.format", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/repos/octokit/request.js/issues/1", "ok", {
      headers: {
        accept: "application/vnd.github.v3.raw+json",
        authorization: "token 0000000000000000000000000000000000000001",
        "user-agent": userAgent,
      },
    });

    const response = await request(
      "GET /repos/{owner}/{repo}/issues/{number}",
      {
        headers: {
          authorization: "token 0000000000000000000000000000000000000001",
        },
        mediaType: {
          format: "raw+json",
        },
        owner: "octokit",
        repo: "request.js",
        number: 1,
        request: {
          fetch: mock.fetchHandler,
        },
      },
    );
    expect(response.data).toEqual("ok");
  });

  it("options.mediaType.previews", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/graphql", "ok", {
      headers: {
        accept:
          "application/vnd.github.foo-preview+json,application/vnd.github.bar-preview+json",
        authorization: "token 0000000000000000000000000000000000000001",
        "user-agent": userAgent,
      },
    });

    const response = await request("GET /graphql", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      mediaType: {
        previews: ["foo", "bar"],
      },
      request: {
        fetch: mock.fetchHandler,
      },
    });
    expect(response.data).toEqual("ok");
  });

  it("octokit/octokit.js#1497", async () => {
    const mock = fetchMock.createInstance();
    mock.put(
      "https://request-errors-test.com/repos/gr2m/sandbox/branches/gr2m-patch-1/protection",
      {
        status: 400,
        body: {
          message: "Validation failed",
          errors: [
            "Only organization repositories can have users and team restrictions",
            { resource: "Search", field: "q", code: "invalid" },
          ],
          documentation_url:
            "https://developer.github.com/v3/repos/branches/#update-branch-protection",
        },
      },
      {
        method: "PUT",
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token secret123",
        },
      },
    );

    await expect(
      request("PUT /repos/{owner}/{repo}/branches/{branch}/protection", {
        baseUrl: "https://request-errors-test.com",
        headers: {
          authorization: "token secret123",
        },
        owner: "gr2m",
        repo: "sandbox",
        branch: "gr2m-patch-1",
        required_status_checks: { strict: true, contexts: ["wip"] },
        enforce_admins: true,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          dismissal_restrictions: { users: [], teams: [] },
        },
        restrictions: { users: [], teams: [] },
        request: {
          fetch: mock.fetchHandler,
        },
      }),
    ).rejects.toHaveProperty(
      "message",
      `Validation failed: "Only organization repositories can have users and team restrictions", {"resource":"Search","field":"q","code":"invalid"} - https://developer.github.com/v3/repos/branches/#update-branch-protection`,
    );
  });

  it("logs deprecation warning if `deprecation` header is present", async () => {
    expect.assertions(3);

    const mock = fetchMock.createInstance();
    mock.get(
      "https://api.github.com/teams/123",
      {
        body: {
          id: 123,
        },
        headers: {
          deprecation: "Sat, 01 Feb 2020 00:00:00 GMT",
          sunset: "Mon, 01 Feb 2021 00:00:00 GMT",
          link: '<https://developer.github.com/changes/2020-01-21-moving-the-team-api-endpoints/>; rel="deprecation"; type="text/html", <https://api.github.com/organizations/3430433/team/4177875>; rel="alternate"',
        },
      },
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token 0000000000000000000000000000000000000001",
          "user-agent": userAgent,
        },
      },
    );

    const warn = vi.fn();

    const response = await request("GET /teams/{team_id}", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      team_id: 123,
      request: { fetch: mock.fetchHandler, log: { warn } },
    });
    expect(response.data).toEqual({ id: 123 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[@octokit/request] "GET https://api.github.com/teams/123" is deprecated. It is scheduled to be removed on Mon, 01 Feb 2021 00:00:00 GMT. See https://developer.github.com/changes/2020-01-21-moving-the-team-api-endpoints/',
    );
  });

  it("deprecation header without deprecation link", async () => {
    const mock = fetchMock.createInstance();
    mock.get(
      "https://api.github.com/teams/123",
      {
        body: {
          id: 123,
        },
        headers: {
          deprecation: "Sat, 01 Feb 2020 00:00:00 GMT",
          sunset: "Mon, 01 Feb 2021 00:00:00 GMT",
        },
      },
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token 0000000000000000000000000000000000000001",
          "user-agent": userAgent,
        },
      },
    );

    const warn = vi.fn();

    const response = await request("GET /teams/{team_id}", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      team_id: 123,
      request: { fetch: mock.fetchHandler, log: { warn } },
    });
    expect(response.data).toEqual({ id: 123 });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[@octokit/request] "GET https://api.github.com/teams/123" is deprecated. It is scheduled to be removed on Mon, 01 Feb 2021 00:00:00 GMT',
    );
  });

  it("404 not found", async () => {
    expect.assertions(3);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/repos/octocat/unknown", {
      status: 404,
      headers: {},
      body: {
        message: "Not Found",
        documentation_url:
          "https://docs.github.com/en/rest/reference/repos#get-a-repository",
      },
    });

    try {
      await request("GET /repos/octocat/unknown", {
        request: {
          fetch: mock.fetchHandler,
        },
      });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error.status).toEqual(404);
      expect(error.response.data.message).toEqual("Not Found");
      expect(error.response.data.documentation_url).toEqual(
        "https://docs.github.com/en/rest/reference/repos#get-a-repository",
      );
    }
  });

  it("Request timeout via an AbortSignal", async () => {
    expect.assertions(3);

    const delay = (millis = 3000) => {
      return new Promise((resolve) => {
        setTimeout(resolve, millis);
      });
    };

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/", () =>
      delay(3000).then(() => ({
        message: "Not Found",
        documentation_url:
          "https://docs.github.com/en/rest/reference/repos#get-a-repository",
      })),
    );

    try {
      await request("GET /", {
        request: {
          fetch: mock.fetchHandler,
          signal: AbortSignal.timeout(500),
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.name).toEqual("AbortError");
      expect(error.message).toEqual("The operation was aborted.");
      expect(error.status).toEqual(500);
    }
  });

  it("validate request with readstream data", async () => {
    expect.assertions(3);

    const size = fs.statSync(__filename).size;
    const mock = fetchMock.createInstance();
    mock.post(
      "https://api.github.com/repos/octokit-fixture-org/release-assets/releases/v1.0.0/assets",
      {
        status: 200,
      },
    );

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        release_id: "v1.0.0",
        request: {
          fetch: mock.fetchHandler,
        },
        headers: {
          "content-type": "text/json",
          "content-length": size,
        },
        data: fs.createReadStream(__filename),
        name: "test-upload.txt",
        label: "test",
      },
    );

    expect(mock.callHistory.calls()[0].options.body).toBeInstanceOf(
      stream.Readable,
    );
    expect(response.status).toEqual(200);
    expect(mock.callHistory.done()).toBe(true);
  });

  it("validate request with data set to Buffer type", async () => {
    expect.assertions(3);

    const mock = fetchMock.createInstance();
    mock.post(
      "https://api.github.com/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      {
        status: 200,
      },
    );

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/tags/{tag}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        request: {
          fetch: mock.fetchHandler,
        },
        headers: {
          "content-type": "text/plain",
        },
        data: Buffer.from("Hello, world!\n"),
        name: "test-upload.txt",
        label: "test",
      },
    );
    expect(response.status).toEqual(200);
    expect(mock.callHistory.calls()[0].options.body).toEqual(
      Buffer.from("Hello, world!\n"),
    );
    expect(mock.callHistory.done()).toBe(true);
  });

  it("validate request with data set to ArrayBuffer type", async () => {
    expect.assertions(3);

    const mock = fetchMock.createInstance();
    mock.post(
      "https://api.github.com/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      {
        status: 200,
      },
    );

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/tags/{tag}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        request: {
          fetch: mock.fetchHandler,
        },
        headers: {
          "content-type": "text/plain",
        },
        data: stringToArrayBuffer("Hello, world!\n"),
        name: "test-upload.txt",
        label: "test",
      },
    );

    expect(response.status).toEqual(200);
    expect(mock.callHistory.calls()[0].options.body).toEqual(
      stringToArrayBuffer("Hello, world!\n"),
    );
    // expect(mock.callHistory.lastCall()[1].body).toEqual(
    //   stringToArrayBuffer("Hello, world!\n"),
    // );
    expect(mock.callHistory.done()).toBe(true);
  });

  it("bubbles up AbortError if the request is aborted", async () => {
    expect.assertions(1);

    const abortController = new AbortController();
    const mock = fetchMock.createInstance();
    mock.post(
      "https://api.github.com/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      new Promise(() => {
        abortController.abort();
      }),
    );

    await expect(
      request("POST /repos/{owner}/{repo}/releases/tags/{tag}", {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        request: {
          fetch: mock.fetchHandler,
          signal: abortController.signal,
        },
        headers: {
          "content-type": "text/plain",
        },
        data: stringToArrayBuffer("Hello, world!\n"),
        name: "test-upload.txt",
        label: "test",
      }),
    ).rejects.toHaveProperty("name", "AbortError");
  });

  it("request should pass the stream in the response", async () => {
    expect.assertions(4);

    const mock = fetchMock.createInstance().get(
      "https://api.github.com/repos/octokit-fixture-org/release-assets/tarball/main",
      {
        status: 200,
        headers: {
          "content-type": "application/x-gzip",
        },
        body: fs.createReadStream(__filename),
      },
      {
        sendAsJson: false,
      },
    );

    const response = await request(
      "GET /repos/{owner}/{repo}/tarball/{branch}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        branch: "main",
        request: {
          parseSuccessResponseBody: false,
          fetch: mock.fetchHandler,
        },
      },
    );

    expect(response.status).toEqual(200);
    expect(response.headers["content-type"]).toEqual("application/x-gzip");
    expect(response.data).toBeInstanceOf(ReadableStream);
    expect(mock.callHistory.done()).toBe(true);
  });

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

  it("invalid error responses should result in errors with a message field describing the error as an unknown error", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.put(
      "https://request-errors-test.com/repos/gr2m/sandbox/branches/gr2m-patch-1/protection",
      {
        status: 400,
        body: {},
      },
      {
        method: "PUT",
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token secret123",
        },
      },
    );

    await expect(
      request("PUT /repos/{owner}/{repo}/branches/{branch}/protection", {
        baseUrl: "https://request-errors-test.com",
        headers: {
          authorization: "token secret123",
        },
        owner: "gr2m",
        repo: "sandbox",
        branch: "gr2m-patch-1",
        required_status_checks: { strict: true, contexts: ["wip"] },
        enforce_admins: true,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          dismiss_stale_reviews: true,
          require_code_owner_reviews: true,
          dismissal_restrictions: { users: [], teams: [] },
        },
        restrictions: { users: [], teams: [] },
        request: {
          fetch: mock.fetchHandler,
        },
      }),
    ).rejects.toHaveProperty("message", "Unknown error: {}");
  });

  it("parses response bodies as JSON when Content-Type is application/scim+json", async () => {
    expect.assertions(1);

    const mock = fetchMock.createInstance();
    mock.get("https://api.github.com/scim/v2/Users", {
      status: 200,
      body: {
        totalResults: 1,
        Resources: [
          {
            id: "123",
            userName: "octocat",
          },
        ],
      },
      headers: {
        "Content-Type": "application/scim+json",
      },
    });

    const response = await request("GET /scim/v2/Users", {
      request: {
        fetch: mock.fetchHandler,
      },
    });

    expect(response.data).toEqual({
      totalResults: 1,
      Resources: [
        {
          id: "123",
          userName: "octocat",
        },
      ],
    });
  });
});
