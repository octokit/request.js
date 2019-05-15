import getUserAgent from "universal-user-agent";
import fetchMock from "fetch-mock";
import { Headers, RequestInit } from "node-fetch";

import { request } from "../src";

const userAgent = `octokit-request.js/0.0.0-development ${getUserAgent()}`;

describe("request()", () => {
  it("is a function", () => {
    expect(request).toBeInstanceOf(Function);
  });

  it("README example", () => {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/orgs/octokit/repos?type=private", [], {
        headers: {
          accept: "application/vnd.github.v3+json",
          authorization: "token 0000000000000000000000000000000000000001",
          "user-agent": userAgent
        }
      });

    return request("GET /orgs/:org/repos", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001"
      },
      org: "octokit",
      type: "private",
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data).toEqual([]);
    });
  });

  it("README example alternative", () => {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/orgs/octokit/repos?type=private", []);

    return request({
      method: "GET",
      url: "/orgs/:org/repos",
      headers: {
        authorization: "token 0000000000000000000000000000000000000001"
      },
      org: "octokit",
      type: "private",
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data).toEqual([]);
    });
  });

  it("Request with body", () => {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/repos/octocat/hello-world/issues", 201, {
        headers: {
          "content-type": "application/json; charset=utf-8"
        }
      });

    request("POST /repos/:owner/:repo/issues", {
      owner: "octocat",
      repo: "hello-world",
      headers: {
        accept: "text/html;charset=utf-8"
      },
      title: "Found a bug",
      body: "I'm having a problem with this.",
      assignees: ["octocat"],
      milestone: 1,
      labels: ["bug"],
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.status).toEqual(201);
    });
  });

  it("Put without request body", () => {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/user/starred/octocat/hello-world", 204, {
        headers: {
          "content-length": "0"
        }
      });

    request("PUT /user/starred/:owner/:repo", {
      headers: {
        authorization: `token 0000000000000000000000000000000000000001`
      },
      owner: "octocat",
      repo: "hello-world",
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.status).toEqual(204);
    });
  });

  it("HEAD requests (octokit/rest.js#841)", () => {
    const mock = fetchMock
      .sandbox()
      .head("https://api.github.com/repos/whatwg/html/pulls/1", {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": 19137
        }
      })
      .head("https://api.github.com/repos/whatwg/html/pulls/2", {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": 120
        }
      });

    const options = {
      owner: "whatwg",
      repo: "html",
      number: 1,
      request: {
        fetch: mock
      }
    };

    request(`HEAD /repos/:owner/:repo/pulls/:number`, options)
      .then(response => {
        expect(response.status).toEqual(200);

        return request(
          `HEAD /repos/:owner/:repo/pulls/:number`,
          Object.assign(options, { number: 2 })
        );
      })

      .then(() => {
        throw new Error("should not resolve");
      })

      .catch(error => {
        expect(error.status).toEqual(404);
      });
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
            "hex"
          ),
          headers: {
            "content-type": "application/x-gzip",
            "content-length": 172
          }
        }
      );

    return request("GET /repos/:owner/:repo/:archive_format/:ref", {
      owner: "octokit-fixture-org",
      repo: "get-archive",
      archive_format: "tarball",
      ref: "master",
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data.length).toEqual(172);
    });
  });

  // TODO: fails with "response.buffer is not a function" in browser
  it("Binary response", () => {
    const mock = fetchMock
      .sandbox()
      .get(
        "https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master",
        {
          status: 200,

          // expect(response.data.length).toEqual(172)
          // body: Buffer.from('1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000', 'hex'),
          body: Buffer.from(
            "1f8b0800000000000003cb4f2ec9cfce2cd14dcbac28292d4ad5cd2f4ad74d4f2dd14d2c4acec82c4bd53580007d060a0050bfb9b9a90203c428741ac2313436343307222320dbc010a8dc5c81c194124b8905a5c525894540a714e5e797e05347481edd734304e41319ff41ae8e2ebeae7ab92964d801d46f66668227fe0d4d51e3dfc8d0c8d808284f75df6201233cfe951590627ba01d330a46c1281805a3806e000024cb59d6000a0000",
            "hex"
          ),
          headers: {
            "content-type": "application/x-gzip",
            "content-length": 172
          }
        }
      );

    return request(
      "GET https://codeload.github.com/octokit-fixture-org/get-archive/legacy.tar.gz/master",
      {
        request: {
          fetch: mock
        }
      }
    );
  });

  it("304 etag", () => {
    const mock = fetchMock.sandbox().get((url, { headers }) => {
      return (
        url === "https://api.github.com/orgs/myorg" &&
        ((headers! as unknown) as Headers).get("if-none-match") === "etag"
      );
    }, 304);

    return request("GET /orgs/:org", {
      org: "myorg",
      headers: { "If-None-Match": "etag" },
      request: {
        fetch: mock
      }
    })
      .then(() => {
        throw new Error("should not resolve");
      })

      .catch(error => {
        expect(error.status).toEqual(304);
      });
  });

  it("Not found", () => {
    const mock = fetchMock.sandbox().get("path:/orgs/nope", 404);

    return request("GET /orgs/:org", {
      org: "nope",
      request: {
        fetch: mock
      }
    })
      .then(() => {
        throw new Error("should not resolve");
      })

      .catch(error => {
        expect(error.status).toEqual(404);
        expect(error.request.method).toEqual("GET");
        expect(error.request.url).toEqual("https://api.github.com/orgs/nope");
      });
  });

  it("non-JSON response", () => {
    const mock = fetchMock
      .sandbox()
      .get("path:/repos/octokit-fixture-org/hello-world/contents/README.md", {
        status: 200,
        body: "# hello-world",
        headers: {
          "content-length": 13,
          "content-type": "application/vnd.github.v3.raw; charset=utf-8"
        }
      });

    return request("GET /repos/:owner/:repo/contents/:path", {
      headers: {
        accept: "application/vnd.github.v3.raw"
      },
      owner: "octokit-fixture-org",
      repo: "hello-world",
      path: "README.md",
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data).toEqual("# hello-world");
    });
  });

  it("Request error", () => {
    // port: 8 // officially unassigned port. See https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
    return request("GET https://127.0.0.1:8/")
      .then(() => {
        throw new Error("should not resolve");
      })

      .catch(error => {
        expect(error.status).toEqual(500);
      });
  });

  it("custom user-agent", () => {
    const mock = fetchMock
      .sandbox()
      .get(
        (url, { headers }) =>
          ((headers as unknown) as Headers).get("user-agent") ===
          "funky boom boom pow",
        200
      );

    return request("GET /", {
      headers: {
        "user-agent": "funky boom boom pow"
      },
      request: {
        fetch: mock
      }
    });
  });

  it("passes node-fetch options to fetch only", () => {
    const mock = (url: string, options: RequestInit) => {
      expect(url).toEqual("https://api.github.com/");
      expect(options.timeout).toEqual(100);
      return Promise.reject(new Error("ok"));
    };

    return request("GET /", {
      headers: {
        "user-agent": "funky boom boom pow"
      },
      request: {
        timeout: 100,
        fetch: mock
      }
    }).catch(error => {
      if (error.message === "ok") {
        return;
      }

      throw error;
    });
  });

  it("422 error with details", () => {
    const mock = fetchMock
      .sandbox()
      .post("https://api.github.com/repos/octocat/hello-world/labels", {
        status: 422,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Foo": "bar"
        },
        body: {
          message: "Validation Failed",
          errors: [
            {
              resource: "Label",
              code: "invalid",
              field: "color"
            }
          ],
          documentation_url:
            "https://developer.github.com/v3/issues/labels/#create-a-label"
        }
      });

    return request("POST /repos/octocat/hello-world/labels", {
      name: "foo",
      color: "invalid",
      request: {
        fetch: mock
      }
    }).catch(error => {
      expect(error.status).toEqual(422);
      expect(error.headers["x-foo"]).toEqual("bar");
      expect(error.documentation_url).toEqual(
        "https://developer.github.com/v3/issues/labels/#create-a-label"
      );
      expect(error.errors).toEqual([
        { resource: "Label", code: "invalid", field: "color" }
      ]);
    });
  });

  it("redacts credentials from error.request.headers.authorization", () => {
    const mock = fetchMock.sandbox().get("https://api.github.com/", {
      status: 500
    });

    return request("/", {
      headers: {
        authorization: "token secret123"
      },
      request: {
        fetch: mock
      }
    }).catch(error => {
      expect(error.request.headers.authorization).toEqual("token [REDACTED]");
    });
  });

  it("redacts credentials from error.request.url", () => {
    const mock = fetchMock
      .sandbox()
      .get("https://api.github.com/?client_id=123&client_secret=secret123", {
        status: 500
      });

    return request("/", {
      client_id: "123",
      client_secret: "secret123",
      request: {
        fetch: mock
      }
    }).catch(error => {
      expect(error.request.url).toEqual(
        "https://api.github.com/?client_id=123&client_secret=[REDACTED]"
      );
    });
  });

  it("error.code (deprecated)", () => {
    const mock = fetchMock.sandbox().get("path:/orgs/nope", 404);

    const consoleWarn = console.warn;
    let warnCalled = 0;
    console.warn = () => warnCalled++;
    return request("GET /orgs/:org", {
      org: "nope",
      request: {
        fetch: mock
      }
    })
      .then(() => {
        throw new Error("should not resolve");
      })

      .catch(error => {
        expect(error.code).toEqual(404);
        expect(warnCalled).toEqual(1);
        console.warn = consoleWarn;
      });
  });

  it("Just URL", () => {
    const mock = fetchMock.sandbox().get("path:/", 200);

    return request("/", {
      request: {
        fetch: mock
      }
    }).then(({ status }) => {
      expect(status).toEqual(200);
    });
  });

  it("Resolves with url", function() {
    // this test cannot be mocked with `fetch-mock`. I don’t like to rely on
    // external websites to run tests, but in this case I’ll make an exception.
    // The alternative would be to start a local server we then send a request to,
    // this would only work in Node, so we would need to adapt the test setup, too.
    // We also can’t test the GitHub API, because on Travis unauthenticated
    // GitHub API requests are usually blocked due to IP rate limiting
    return request("https://www.githubstatus.com/api/v2/status.json").then(
      ({ url }) => {
        expect(url).toEqual("https://www.githubstatus.com/api/v2/status.json");
      }
    );
  });

  it("options.request.signal is passed as option to fetch", function() {
    return request("/", {
      request: {
        signal: "funk"
      }
    })
      .then(() => {
        throw new Error("Should not resolve");
      })

      .catch(error => {
        expect(error.message).toMatch(/\bsignal\b/i);
        expect(error.message).toMatch(/\bAbortSignal\b/i);
      });
  });

  it("options.request.fetch", function() {
    return request("/", {
      request: {
        fetch: () =>
          Promise.resolve({
            status: 200,
            headers: new Headers({
              "Content-Type": "application/json; charset=utf-8"
            }),
            url: "http://api.github.com/",
            json() {
              return Promise.resolve("funk");
            }
          })
      }
    }).then(result => {
      expect(result.data).toEqual("funk");
    });
  });

  it("options.mediaType.format", function() {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/repos/octokit/request.js/issues/1", "ok", {
        headers: {
          accept: "application/vnd.github.v3.raw+json",
          authorization: "token 0000000000000000000000000000000000000001",
          "user-agent": userAgent
        }
      });

    return request("GET /repos/:owner/:repo/issues/:number", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001"
      },
      mediaType: {
        format: "raw+json"
      },
      owner: "octokit",
      repo: "request.js",
      number: 1,
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data).toEqual("ok");
    });
  });

  it("options.mediaType.previews", function() {
    const mock = fetchMock
      .sandbox()
      .mock("https://api.github.com/repos/octokit/request.js/issues/1", "ok", {
        headers: {
          accept:
            "application/vnd.github.foo-preview+json,application/vnd.github.bar-preview+json",
          authorization: "token 0000000000000000000000000000000000000001",
          "user-agent": userAgent
        }
      });

    return request("GET /repos/:owner/:repo/issues/:number", {
      headers: {
        authorization: "token 0000000000000000000000000000000000000001"
      },
      mediaType: {
        previews: ["foo", "bar"]
      },
      owner: "octokit",
      repo: "request.js",
      number: 1,
      request: {
        fetch: mock
      }
    }).then(response => {
      expect(response.data).toEqual("ok");
    });
  });
});
