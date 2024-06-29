import zlib from "node:zlib";
import fs from "node:fs";
import { ReadableStream } from "node:stream/web";

import { describe, it, expect, vi } from "vitest";
import { getUserAgent } from "universal-user-agent";
import fetchMock from "fetch-mock";
import { createAppAuth } from "@octokit/auth-app";
import type { EndpointOptions, RequestInterface } from "@octokit/types";

import bodyParser from "./body-parser.ts";
import mockRequestHttpServer from "./mockRequestHttpServer.ts";
import { request } from "../src/index.ts";

const userAgent = `octokit-request.js/0.0.0-development ${getUserAgent()}`;
const __filename = new URL(import.meta.url);
function stringToArrayBuffer(str: string) {
  return new TextEncoder().encode(str).buffer;
}

describe("request()", () => {
  it("is a function", async () => {
    const request = await mockRequestHttpServer(() => {});
    expect(request).toBeInstanceOf(Function);
  });

  it("README example", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(
        req.headers.authorization,
        "token 0000000000000000000000000000000000000001",
      );
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/orgs/octokit/repos?type=private");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end("[]");
    });

    const response = await request("GET /orgs/{org}/repos", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      org: "octokit",
      type: "private",
    });
    expect(response.data).toEqual([]);
    request.closeMockServer();
  });

  it("README example alternative", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.headers.authorization).toBe(
        "token 0000000000000000000000000000000000000001",
      );
      expect(req.url).toBe("/orgs/octokit/repos?type=private");
      expect(req.method).toBe("GET");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end("[]");
    });

    const response = await request({
      method: "GET",
      url: "/orgs/{org}/repos",
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      org: "octokit",
      type: "private",
    });
    expect(response.data).toEqual([]);
  });

  it("README authentication example", async () => {
    expect.assertions(12);

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

    let called = 0;

    const request = await mockRequestHttpServer((req, res) => {
      switch (req.url) {
        case "/app/installations/123/access_tokens":
          {
            expect(req.method).toBe("POST");
            expect(req.headers.accept).toBe("application/vnd.github.v3+json");
            expect(req.headers["user-agent"]).toBe(userAgent);

            res.writeHead(200, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                token: "secret123",
                expires_at: "1970-01-01T01:00:00.000Z",
                permissions: {
                  metadata: "read",
                },
                repository_selection: "all",
              }),
            );
            called += 0b1;
          }
          break;
        case "/app":
          {
            expect(req.method).toBe("GET");
            expect(req.headers.accept).toBe("application/vnd.github.v3+json");
            expect(req.headers["user-agent"]).toBe(userAgent);
            expect(req.headers.authorization).toBe(`bearer ${BEARER}`);

            res.writeHead(200, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                id: 123,
              }),
            );
            called += 0b10;
          }
          break;
        case "/repos/octocat/hello-world/issues":
          {
            expect(req.method).toBe("POST");
            expect(req.headers.accept).toBe("application/vnd.github.v3+json");
            expect(req.headers["user-agent"]).toBe(userAgent);
            expect(req.headers.authorization).toBe(`token secret123`);

            res.writeHead(200, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                id: 456,
              }),
            );
            called += 0b100;
          }
          break;
        default:
          res.writeHead(404);
          res.end();
      }
    });

    const auth = createAppAuth({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId: 123,
    });
    const requestWithAuth = request.defaults({
      request: {
        hook: auth.hook,
      },
    });
    await requestWithAuth("GET /app");
    await requestWithAuth("POST /repos/{owner}/{repo}/issues", {
      owner: "octocat",
      repo: "hello-world",
      title: "Hello from the engine room",
    });

    expect(called).toBe(0b111);
    vi.useRealTimers();
  });

  it("Request with body", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("POST");
      expect(req.url).toBe("/repos/octocat/hello-world/issues");
      expect(req.headers.accept).toBe("text/html;charset=utf-8");
      expect(req.headers["user-agent"]).toBe(userAgent);
      expect(await bodyParser(req)).toBe(
        '{"title":"Found a bug","body":"I\'m having a problem with this.","assignees":["octocat"],"milestone":1,"labels":["bug"]}',
      );

      res.writeHead(201, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end();
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
    });

    expect(response.status).toEqual(201);

    request.closeMockServer();
  });

  it("Put without request body", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("PUT");
      expect(req.url).toBe("/user/starred/octocat/hello-world");
      expect(req.headers.authorization).toBe(
        "token 0000000000000000000000000000000000000001",
      );
      expect(await bodyParser(req)).toBe("");

      res.writeHead(204);
      res.end();
    });

    const response = await request("PUT /user/starred/{owner}/{repo}", {
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`,
      },
      owner: "octocat",
      repo: "hello-world",
    });
    expect(response.status).toEqual(204);
  });

  it("HEAD requests (octokit/rest.js#841)", async () => {
    expect.assertions(4);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("HEAD");

      switch (req.url) {
        case "/repos/whatwg/html/pulls/1":
          {
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
              "Content-Length": "19137",
            });
          }
          break;
        case "/repos/whatwg/html/pulls/2":
          {
            res.writeHead(404, {
              "Content-Type": "application/json; charset=utf-8",
              "Content-Length": "120",
            });
          }
          break;
        default: {
          res.writeHead(500);
        }
      }

      res.end();
    });

    const options = {
      owner: "whatwg",
      repo: "html",
      number: 1,
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

  it.skip("Binary response with redirect (🤔 unclear how to mock fetch redirect properly)", () => {
    const mock = fetchMock
      .sandbox()
      .get(
        "https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master",
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

    return request("GET /repos/{owner}/{repo}/{archive_format}/{ref}", {
      owner: "octokit-fixture-org",
      repo: "get-archive",
      archive_format: "tarball",
      ref: "master",
      request: {
        fetch: mock,
      },
    }).then((response) => {
      expect(response.data.length).toEqual(172);
    });
  });

  it("Binary response", async () => {
    expect.assertions(9);

    const payload =
      "1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000";

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe(
        "/octokit-fixture-org/get-archive/legacy.tar.gz/master",
      );
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "content-type": "application/x-gzip",
        "content-length": "172",
      });
      res.end(Buffer.from(payload, "hex"));
    });

    const response = await request(
      `GET ${request.baseUrlMockServer}/octokit-fixture-org/get-archive/legacy.tar.gz/master`,
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
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.url).toBe("/orgs/myorg");
      expect(req.method).toBe("GET");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["if-none-match"]).toBe("etag");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(304);
      res.end();
    });

    await expect(
      request("GET /orgs/{org}", {
        org: "myorg",
        headers: { "If-None-Match": "etag" },
      }),
    ).rejects.toHaveProperty("status", 304);

    request.closeMockServer();
  });

  it("304 last-modified", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.url).toBe("/orgs/myorg");
      expect(req.method).toBe("GET");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["if-modified-since"]).toBe(
        "Sun Dec 24 2017 22:00:00 GMT-0600 (CST)",
      );
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(304);
      res.end();
    });

    await expect(
      request("GET /orgs/{org}", {
        org: "myorg",
        headers: {
          "If-Modified-Since": "Sun Dec 24 2017 22:00:00 GMT-0600 (CST)",
        },
      }),
    ).rejects.toHaveProperty("status", 304);

    request.closeMockServer();
  });

  it("Not found", async () => {
    expect.assertions(7);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.url).toBe("/orgs/nope");
      expect(req.method).toBe("GET");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(404);
      res.end();
    });

    try {
      await request("GET /orgs/{org}", {
        org: "nope",
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.status).toEqual(404);
      expect(error.request.method).toEqual("GET");
      expect(error.request.url).toMatch(/\/orgs\/nope$/);
    } finally {
      request.closeMockServer();
    }
  });

  it("error response with no body (octokit/request.js#649)", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/hello-world/contents/README.md",
      );
      expect(req.headers.accept).toBe("content-type: application/json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(500, {
        "content-type": "application/json",
      });
      res.end("");
    });

    try {
      await request("GET /repos/{owner}/{repo}/contents/{path}", {
        headers: {
          accept: "content-type: application/json",
        },
        owner: "octokit-fixture-org",
        repo: "hello-world",
        path: "README.md",
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.response.data).toBe("");
    } finally {
      request.closeMockServer();
    }
  });

  it("non-JSON response", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/hello-world/contents/README.md",
      );
      expect(req.headers.accept).toBe("application/vnd.github.v3.raw");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "content-length": "13",
        "content-type": "application/vnd.github.v3.raw; charset=utf-8",
      });
      res.end("# hello-world");
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
      },
    );
    expect(response.data).toEqual("# hello-world");
  });

  it("custom user-agent", async () => {
    expect.assertions(3);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/");
      expect(req.headers["user-agent"]).toBe("funky boom boom pow");

      res.writeHead(200);
      res.end("");
    });

    await request("GET /", {
      headers: {
        "user-agent": "funky boom boom pow",
      },
    });
  });

  it("422 error with details", async () => {
    expect.assertions(8);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("POST");
      expect(req.url).toBe("/repos/octocat/hello-world/labels");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(422, {
        "Content-Type": "application/json; charset=utf-8",
        "X-Foo": "bar",
      });
      res.end(
        JSON.stringify({
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
        }),
      );
    });

    try {
      await request("POST /repos/octocat/hello-world/labels", {
        name: "foo",
        color: "invalid",
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
    } finally {
      request.closeMockServer();
    }
  });

  it("redacts credentials from error.request.headers.authorization", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/");
      expect(req.headers.authorization).toBe("token secret123");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(500);
      res.end();
    });

    try {
      await request("/", {
        headers: {
          authorization: "token secret123",
        },
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.request.headers.authorization).toEqual("token [REDACTED]");
    } finally {
      request.closeMockServer();
    }
  });

  it("redacts credentials from error.request.url", async () => {
    expect.assertions(4);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/?client_id=123&client_secret=secret123");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(500);
      res.end();
    });

    try {
      await request("/", {
        client_id: "123",
        client_secret: "secret123",
      });
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.request.url).toMatch(
        /\?client_id=123&client_secret=\[REDACTED\]$/,
      );
    } finally {
      request.closeMockServer();
    }
  });

  it("Just URL", async () => {
    expect.assertions(4);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200);
      res.end();
    });

    const response = await request("/", {});

    expect(response.status).toEqual(200);

    request.closeMockServer();
  });

  it("options.request.hook", async () => {
    expect.assertions(7);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/foo");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "content-type": "application/json",
        "x-foo": "bar",
      });
      res.end(JSON.stringify({ ok: true }));
    });

    const baseUrl = request.baseUrlMockServer;

    const hook = (request: RequestInterface, options: EndpointOptions) => {
      expect(request.endpoint).toBeInstanceOf(Function);
      expect(request.defaults).toBeInstanceOf(Function);
      expect(options).toEqual({
        baseUrl,
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": userAgent,
        },
        mediaType: {
          format: "",
        },
        method: "GET",
        request: {
          hook,
        },
        url: "/",
      });

      return request("/foo", {
        headers: {
          "x-foo": "bar",
        },
      });
    };

    const response = await request("/", {
      request: {
        hook,
      },
    });
    expect(response.data).toEqual({ ok: true });
  });

  it("options.mediaType.format", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/repos/octokit/request.js/issues/1");
      expect(req.headers.accept).toBe("application/vnd.github.v3.raw+json");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200);
      res.end("ok");
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
      },
    );
    expect(response.data).toEqual("ok");
  });

  it("options.mediaType.previews", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/graphql");
      expect(req.headers.accept).toBe(
        "application/vnd.github.foo-preview+json,application/vnd.github.bar-preview+json",
      );
      expect(req.headers.authorization).toBe(
        "token 0000000000000000000000000000000000000001",
      );
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200);
      res.end("ok");
    });

    const response = await request("GET /graphql", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      mediaType: {
        previews: ["foo", "bar"],
      },
    });
    expect(response.data).toEqual("ok");
  });

  it("octokit/octokit.js#1497", async () => {
    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("PUT");
      expect(req.url).toBe(
        "/repos/gr2m/sandbox/branches/gr2m-patch-1/protection",
      );
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers.authorization).toBe("token secret123");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(400, {
        "content-type": "application/json",
      });
      res.end(
        JSON.stringify({
          message: "Validation failed",
          errors: [
            "Only organization repositories can have users and team restrictions",
            { resource: "Search", field: "q", code: "invalid" },
          ],
          documentation_url:
            "https://developer.github.com/v3/repos/branches/#update-branch-protection",
        }),
      );
    });

    await expect(
      request("PUT /repos/{owner}/{repo}/branches/{branch}/protection", {
        baseUrl: request.baseUrlMockServer,
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
      }),
    ).rejects.toHaveProperty(
      "message",
      `Validation failed: "Only organization repositories can have users and team restrictions", {"resource":"Search","field":"q","code":"invalid"} - https://developer.github.com/v3/repos/branches/#update-branch-protection`,
    );
  });

  it("logs deprecation warning if `deprecation` header is present", async () => {
    expect.assertions(8);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/teams/123");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers.authorization).toBe(
        "token 0000000000000000000000000000000000000001",
      );
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "content-type": "application/json",
        deprecation: "Sat, 01 Feb 2020 00:00:00 GMT",
        sunset: "Mon, 01 Feb 2021 00:00:00 GMT",
        link: '<https://developer.github.com/changes/2020-01-21-moving-the-team-api-endpoints/>; rel="deprecation"; type="text/html", <https://api.github.com/organizations/3430433/team/4177875>; rel="alternate"',
      });
      res.end(
        JSON.stringify({
          id: 123,
        }),
      );
    });

    let calledWarn = 0;
    const warn = (message: string) => {
      expect(++calledWarn).toBe(1);
      expect(message).toBe(
        `[@octokit/request] "GET ${request.baseUrlMockServer}/teams/123" is deprecated. It is scheduled to be removed on Mon, 01 Feb 2021 00:00:00 GMT. See https://developer.github.com/changes/2020-01-21-moving-the-team-api-endpoints/`,
      );
    };

    const response = await request("GET /teams/{team_id}", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      team_id: 123,
      request: { log: { warn } },
    });
    expect(response.data).toEqual({ id: 123 });
  });

  it("deprecation header without deprecation link", async () => {
    expect.assertions(8);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/teams/123");
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers.authorization).toBe(
        "token 0000000000000000000000000000000000000001",
      );
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(200, {
        "content-type": "application/json",
        deprecation: "Sat, 01 Feb 2020 00:00:00 GMT",
        sunset: "Mon, 01 Feb 2021 00:00:00 GMT",
      });
      res.end(
        JSON.stringify({
          id: 123,
        }),
      );
    });

    let calledWarn = 0;
    const warn = (message: string) => {
      expect(++calledWarn).toBe(1);
      expect(message).toBe(
        `[@octokit/request] "GET ${request.baseUrlMockServer}/teams/123" is deprecated. It is scheduled to be removed on Mon, 01 Feb 2021 00:00:00 GMT`,
      );
    };

    const response = await request("GET /teams/{team_id}", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001",
      },
      team_id: 123,
      request: { log: { warn } },
    });
    expect(response.data).toEqual({ id: 123 });
  });

  it("404 not found", { skip: true }, async () => {
    expect.assertions(3);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/repos/octocat/unknown");

      res.writeHead(404);
      res.end(
        JSON.stringify({
          message: "Not Found",
          documentation_url:
            "https://docs.github.com/en/rest/reference/repos#get-a-repository",
        }),
      );
    });

    try {
      await request("GET /repos/octocat/unknown");
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error.status).toEqual(404);
      expect(error.response.data.message).toEqual("Not Found");
      expect(error.response.data.documentation_url).toEqual(
        "https://docs.github.com/en/rest/reference/repos#get-a-repository",
      );
    }
  });

  it("Request timeout", { skip: true }, async () => {
    expect.assertions(4);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe("/");

      await new Promise((resolve) => setTimeout(resolve, 3000));
      res.writeHead(200);
      res.end(
        JSON.stringify({
          message: "OK",
        }),
      );
    });

    try {
      await request("GET /");
      throw new Error("should not resolve");
    } catch (error) {
      expect(error.name).toEqual("HttpError");
      expect(error.status).toEqual(500);
    }
  });

  it("validate request with readstream data", async () => {
    expect.assertions(6);

    const size = fs.statSync(__filename).size;

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("POST");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/release-assets/releases/v1.0.0/assets",
      );
      expect(req.headers["content-type"]).toBe("text/json");
      expect(req.headers["content-length"]).toBe(size.toString());

      expect(
        await bodyParser(req),
        fs.readFileSync(__filename).toString("ascii"),
      );

      res.writeHead(200);
      res.end();
    });

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/{release_id}/assets",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        release_id: "v1.0.0",
        headers: {
          "content-type": "text/json",
          "content-length": size,
        },
        data: fs.createReadStream(__filename),
        name: "test-upload.txt",
        label: "test",
      },
    );
    expect(response.status).toEqual(200);
  });

  it("validate request with data set to Buffer type", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("POST");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      );
      expect(req.headers["content-type"]).toBe("text/plain");

      expect(await bodyParser(req), "Hello, world!\n");

      res.writeHead(200);
      res.end();
    });

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/tags/{tag}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        headers: {
          "content-type": "text/plain",
        },
        data: Buffer.from("Hello, world!\n"),
        name: "test-upload.txt",
        label: "test",
      },
    );
    expect(response.status).toEqual(200);
  });

  it("validate request with data set to ArrayBuffer type", async () => {
    expect.assertions(5);

    const request = await mockRequestHttpServer(async (req, res) => {
      expect(req.method).toBe("POST");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      );
      expect(req.headers["content-type"]).toBe("text/plain");

      expect(await bodyParser(req), "Hello, world!\n");

      res.writeHead(200);
      res.end();
    });

    const response = await request(
      "POST /repos/{owner}/{repo}/releases/tags/{tag}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        headers: {
          "content-type": "text/plain",
        },
        data: stringToArrayBuffer("Hello, world!\n"),
        name: "test-upload.txt",
        label: "test",
      },
    );

    expect(response.status).toEqual(200);
  });

  it("bubbles up AbortError if the request is aborted", async () => {
    expect.assertions(3);

    const abortController = new AbortController();

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/release-assets/releases/tags/v1.0.0",
      );
      expect(req.method).toBe("POST");
      abortController.abort();
      res.writeHead(200);
      res.end("{}");
    });

    await expect(
      request("POST /repos/{owner}/{repo}/releases/tags/{tag}", {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        tag: "v1.0.0",
        request: {
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
    expect.assertions(6);

    let done = false;

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("GET");
      expect(req.url).toBe(
        "/repos/octokit-fixture-org/release-assets/tarball/main",
      );
      res.writeHead(200, {
        "content-type": "application/x-gzip",
      });
      res.end(fs.readFileSync(__filename), () => {
        done = true;
      });
    });

    const response = await request(
      "GET /repos/{owner}/{repo}/tarball/{branch}",
      {
        owner: "octokit-fixture-org",
        repo: "release-assets",
        branch: "main",
        request: {
          parseSuccessResponseBody: false,
        },
      },
    );

    expect(response.status).toEqual(200);
    expect(response.headers["content-type"]).toEqual("application/x-gzip");
    expect(response.data).toBeInstanceOf(ReadableStream);
    expect(done).toBe(true);
  });

  it("invalid error responses should result in errors with a message field describing the error as an unknown error", async () => {
    expect.assertions(6);

    const request = await mockRequestHttpServer((req, res) => {
      expect(req.method).toBe("PUT");
      expect(req.url).toBe(
        "/repos/gr2m/sandbox/branches/gr2m-patch-1/protection",
      );
      expect(req.headers.accept).toBe("application/vnd.github.v3+json");
      expect(req.headers.authorization).toBe("token secret123");
      expect(req.headers["user-agent"]).toBe(userAgent);

      res.writeHead(400, {
        "Content-Type": "application/json",
      });
      res.end("{}");
    });

    await expect(
      request("PUT /repos/{owner}/{repo}/branches/{branch}/protection", {
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
      }),
    ).rejects.toHaveProperty("message", "Unknown error: {}");

    request.closeMockServer();
  });
});
