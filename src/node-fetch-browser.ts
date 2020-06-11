// ref: https://github.com/tc39/proposal-global
function getGlobal() {
  // the only reliable means to get the global object is
  // `Function('return this')()`
  // However, this causes CSP violations in Chrome apps.
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}

const globalScope = getGlobal();

export default globalScope.fetch.bind(globalScope);

export const Headers = globalScope.Headers;
export const Request = globalScope.Request;
export const Response = globalScope.Response;
